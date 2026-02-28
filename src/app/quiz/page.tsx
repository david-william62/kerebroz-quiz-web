'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import CountdownTimer from '@/components/CountdownTimer';
import CyberButton from '@/components/CyberButton';

const TIME_PER_QUESTION = 30; // seconds
const BASE_POINTS = 10;
const MAX_TIME_BONUS = 10;

interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

interface AnswerRecord {
  questionId: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  basePoints: number;
  timeBonus: number;
}

type Phase = 'loading' | 'error' | 'quiz' | 'submitting';

export default function QuizPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [timerKey, setTimerKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Guard: must have registered
  useEffect(() => {
    const user = sessionStorage.getItem('quiz_user');
    if (!user) { router.replace('/register'); return; }

    fetch('/api/questions')
      .then((r) => r.json())
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setPhase('quiz');
        } else {
          setErrorMsg('No questions available. Please check back later.');
          setPhase('error');
        }
      })
      .catch(() => {
        setErrorMsg('Failed to load questions. Please try again.');
        setPhase('error');
      });
  }, [router]);

  const advanceQuestion = useCallback((
    option: string | null,
    remainingTime: number
  ) => {
    setTimerRunning(false);
    const q = questions[currentIndex];
    const isCorrect = option !== null && option === q.correctAnswer;
    const basePoints = isCorrect ? BASE_POINTS : 0;
    const timeBonus = isCorrect ? Math.round((remainingTime / TIME_PER_QUESTION) * MAX_TIME_BONUS) : 0;

    const record: AnswerRecord = {
      questionId: q.id,
      question: q.question,
      options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
      userAnswer: option,
      correctAnswer: q.correctAnswer,
      isCorrect,
      basePoints,
      timeBonus,
    };

    const newAnswers = [...answers, record];
    setAnswers(newAnswers);

    if (currentIndex + 1 >= questions.length) {
      // Submit phase
      setPhase('submitting');
      const user = JSON.parse(sessionStorage.getItem('quiz_user') ?? '{}');
      const totalScore = newAnswers.reduce((s, a) => s + a.basePoints + a.timeBonus, 0);
      const correctCount = newAnswers.filter((a) => a.isCorrect).length;

      const resultPayload = {
        name: user.name,
        registerNo: user.registerNo,
        totalScore,
        correctCount,
        totalQuestions: newAnswers.length,
        answers: JSON.stringify(newAnswers),
      };

      sessionStorage.setItem('quiz_result', JSON.stringify(resultPayload));

      fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultPayload),
      })
        .then(() => router.push('/results'))
        .catch((e) => {
          console.error('Submit failed:', e);
          router.push('/results'); // still redirect on error to prevent being stuck
        });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setTimeLeft(TIME_PER_QUESTION);
      setTimerKey((k) => k + 1);
      setTimerRunning(true);
    }
  }, [questions, currentIndex, answers, router]);

  const handleTimerExpire = useCallback(() => {
    advanceQuestion(null, 0);
  }, [advanceQuestion]);

  const handleSelectOption = (opt: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);
    setTimerRunning(false);
    // Brief pause so user sees their selection then advance
    setTimeout(() => advanceQuestion(opt, timeLeft), 800);
  };

  // ── Track remaining time for time-bonus calc
  useEffect(() => {
    if (!timerRunning || phase !== 'quiz') return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, phase, timerKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (phase === 'quiz') setTimeLeft(TIME_PER_QUESTION);
  }, [currentIndex, phase]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <CircuitBackground />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div
            style={{
              width: '48px', height: '48px', borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--cyan)',
              animation: 'spin-slow 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p className="font-orbitron" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
            LOADING QUESTIONS...
          </p>
        </div>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <CircuitBackground />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <p style={{ color: 'var(--danger)', fontSize: '2rem', marginBottom: '1rem' }}>⚠</p>
          <h2 className="font-orbitron" style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>ERROR</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{errorMsg}</p>
          <CyberButton onClick={() => router.push('/')}>← BACK TO HOME</CyberButton>
        </div>
      </main>
    );
  }

  if (phase === 'submitting') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <CircuitBackground />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div
            style={{
              width: '48px', height: '48px', borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--neon-green)',
              animation: 'spin-slow 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p className="font-orbitron" style={{ color: 'var(--neon-green)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
            SUBMITTING RESULTS...
          </p>
        </div>
      </main>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const options: { key: 'A' | 'B' | 'C' | 'D'; label: string }[] = [
    { key: 'A', label: q.optionA },
    { key: 'B', label: q.optionB },
    { key: 'C', label: q.optionC },
    { key: 'D', label: q.optionD },
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CircuitBackground />

      {/* Top bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-dim)',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span className="font-orbitron" style={{ color: 'var(--cyan)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
          EKTHA TECH QUIZ
        </span>
        <span className="badge badge-cyan">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="progress-bar-track" style={{ borderRadius: 0, height: '3px' }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Timer */}
          <CountdownTimer
            key={timerKey}
            totalSeconds={TIME_PER_QUESTION}
            onExpire={handleTimerExpire}
            running={timerRunning}
          />

          {/* Question card */}
          <div
            className="glass-card glow-border animate-fade-in-up"
            style={{ padding: '1.75rem' }}
          >
            <div
              className="font-orbitron"
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                marginBottom: '0.75rem',
              }}
            >
              QUESTION {currentIndex + 1}
            </div>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--text-primary)', fontWeight: 500 }}>
              {q.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {options.map(({ key, label }) => {
              let extraClass = '';
              if (selectedOption !== null) {
                if (key === q.correctAnswer) extraClass = 'correct';
                else if (key === selectedOption) extraClass = 'wrong';
              } else if (key === selectedOption) {
                extraClass = 'selected';
              }

              return (
                <button
                  key={key}
                  className={`option-btn ${extraClass} animate-fade-in-up`}
                  onClick={() => handleSelectOption(key)}
                  disabled={selectedOption !== null}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      border: '1px solid currentColor',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {key}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Skip */}
          {selectedOption === null && (
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => advanceQuestion(null, timeLeft)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cyan)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                skip →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
