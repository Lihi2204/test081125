import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Drive client
function getGoogleAuth() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '', 'base64').toString()
  );

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

function getDrive() {
  const auth = getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '';

export interface UploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
}

// Upload video file to Google Drive
export async function uploadVideo(
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string = 'video/webm'
): Promise<UploadResult> {
  const drive = getDrive();

  // Create readable stream from buffer
  const readable = new Readable();
  readable.push(fileBuffer);
  readable.push(null);

  // Upload file
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [DRIVE_FOLDER_ID],
    },
    media: {
      mimeType,
      body: readable,
    },
    fields: 'id,webViewLink,webContentLink',
  });

  const fileId = response.data.id || '';

  // Set permissions (restricted to specific users)
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'user',
      emailAddress: process.env.INSTRUCTOR_EMAIL || 'lihi.cyn@gmail.com',
    },
    sendNotificationEmail: false,
  });

  return {
    fileId,
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    webContentLink:
      response.data.webContentLink ||
      `https://drive.google.com/uc?id=${fileId}&export=download`,
  };
}

// Delete video file from Google Drive
export async function deleteVideo(fileId: string): Promise<boolean> {
  const drive = getDrive();

  try {
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

// Get file metadata
export async function getFileMetadata(
  fileId: string
): Promise<{ name: string; size: number; createdTime: string } | null> {
  const drive = getDrive();

  try {
    const response = await drive.files.get({
      fileId,
      fields: 'name,size,createdTime',
    });

    return {
      name: response.data.name || '',
      size: parseInt(response.data.size || '0'),
      createdTime: response.data.createdTime || '',
    };
  } catch (error) {
    console.error('Failed to get file metadata:', error);
    return null;
  }
}

// Download file from Google Drive
export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = getDrive();

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

// List files in folder (for cleanup)
export async function listOldFiles(daysOld: number = 14): Promise<Array<{ id: string; name: string; createdTime: string }>> {
  const drive = getDrive();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffString = cutoffDate.toISOString();

  const response = await drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and createdTime < '${cutoffString}'`,
    fields: 'files(id,name,createdTime)',
  });

  return (response.data.files || []).map((file) => ({
    id: file.id || '',
    name: file.name || '',
    createdTime: file.createdTime || '',
  }));
}
