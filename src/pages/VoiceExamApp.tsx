import { useState } from 'react';
import WelcomeScreen from '../components/voice-exam/WelcomeScreen';
import VoiceExam from '../components/voice-exam/VoiceExam';
import type { ExamResults } from '../components/voice-exam/VoiceExam';
import ResultScreen from '../components/voice-exam/ResultScreen';

type Stage = 'welcome' | 'exam' | 'results';

interface StudentInfo {
  firstName: string;
  lastName: string;
  idNumber: string;
}

export default function VoiceExamApp() {
  const [stage, setStage] = useState<Stage>('welcome');
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    firstName: '',
    lastName: '',
    idNumber: ''
  });
  const [examResults, setExamResults] = useState<ExamResults | null>(null);

  const handleStart = (info: StudentInfo) => {
    setStudentInfo(info);
    setStage('exam');
  };

  const handleComplete = (results: ExamResults) => {
    setExamResults(results);
    setStage('results');
  };

  return (
    <>
      {stage === 'welcome' && (
        <WelcomeScreen onStart={handleStart} />
      )}
      {stage === 'exam' && (
        <VoiceExam
          studentInfo={studentInfo}
          onComplete={handleComplete}
        />
      )}
      {stage === 'results' && (
        <ResultScreen results={examResults} />
      )}
    </>
  );
}
