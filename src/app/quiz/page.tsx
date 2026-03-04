'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import CountdownTimer from '@/components/CountdownTimer';
import CyberButton from '@/components/CyberButton';

const TIME_PER_QUESTION = 30; // seconds
const BASE_POINTS = 10;
const MAX_TIME_BONUS = 10;
const MAX_QUESTIONS = 10;

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

/** Fisher-Yates shuffle, returns a new array */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'loading' | 'error' | 'quiz' | 'submitting' | 'done';

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

  const [doneCountdown, setDoneCountdown] = useState(30);

  // Guard: must have registered
  useEffect(() => {
    const user = sessionStorage.getItem('quiz_user');
    if (!user) { router.replace('/register'); return; }

    fetch('/api/questions')
      .then((r) => r.json())
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          // Shuffle and pick up to MAX_QUESTIONS random questions
          const selected = shuffleArray(data.questions as Question[]).slice(0, MAX_QUESTIONS);
          setQuestions(selected);
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

  // Auto-redirect countdown after quiz done
  useEffect(() => {
    if (phase !== 'done') return;
    if (doneCountdown <= 0) { router.replace('/'); return; }
    const t = setTimeout(() => setDoneCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, doneCountdown, router]);

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
      // Build & save result, then show inline summary
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
        .catch((e) => console.error('Submit failed:', e))
        .finally(() => setPhase('done'));
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

  if (phase === 'done') {
    const resultRaw = sessionStorage.getItem('quiz_result');
    const result = resultRaw ? JSON.parse(resultRaw) : null;
    const doneAnswers: AnswerRecord[] = result ? (() => { try { return JSON.parse(result.answers); } catch { return []; } })() : [];
    const maxScore = (result?.totalQuestions ?? 0) * 20;
    const scorePct = maxScore > 0 ? Math.round(((result?.totalScore ?? 0) / maxScore) * 100) : 0;
    const scoreColor = scorePct >= 70 ? 'var(--neon-green)' : scorePct >= 40 ? 'var(--cyan)' : 'var(--danger)';
    const rankLabel = scorePct >= 80 ? '🏆 EXCEPTIONAL' : scorePct >= 60 ? '⚡ PROFICIENT' : scorePct >= 40 ? '🔷 COMPETENT' : '🔹 KEEP PRACTICING';
    const timeBonus = doneAnswers.reduce((s, a) => s + a.timeBonus, 0);

    return (
      <main style={{ minHeight: '100vh', position: 'relative', paddingBottom: '4rem' }}>
        <CircuitBackground />

        {/* Top bar */}
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-dim)',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}>
          <span className="font-orbitron" style={{ color: 'var(--cyan)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>EKTHA TECH QUIZ</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Returning home in{' '}
            <span className="font-orbitron" style={{ color: doneCountdown <= 10 ? 'var(--danger)' : 'var(--cyan)' }}>{doneCountdown}s</span>
          </span>
        </div>

        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: '720px', margin: '0 auto',
          padding: '2rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
        }}>

          {/* Hero score card */}
          <div className="glass-card glow-border animate-fade-in-up" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="badge badge-cyan" style={{ marginBottom: '1rem' }}>QUIZ COMPLETE — {MAX_QUESTIONS} QUESTIONS</div>

            <div className="font-orbitron" style={{
              fontSize: 'clamp(3rem, 12vw, 5rem)',
              fontWeight: 900,
              color: scoreColor,
              textShadow: `0 0 24px ${scoreColor}80`,
              lineHeight: 1,
              marginBottom: '0.25rem',
            }}>
              {result?.totalScore ?? 0}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>out of {maxScore} points</div>

            {/* Score bar */}
            <div className="progress-bar-track" style={{ maxWidth: '300px', margin: '0 auto 1rem', height: '6px' }}>
              <div style={{
                height: '100%',
                width: `${scorePct}%`,
                background: scoreColor,
                borderRadius: '3px',
                boxShadow: `0 0 10px ${scoreColor}80`,
                transition: 'width 1.5s ease',
              }} />
            </div>

            <div className="font-orbitron" style={{ color: scoreColor, fontSize: '0.85rem', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
              {rankLabel}
            </div>

            {result && (
              <p style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                {result.name}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({result.registerNo})</span>
              </p>
            )}
          </div>

          {/* Stat breakdown */}
          <div className="animate-fade-in-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: 'CORRECT', value: `${result?.correctCount ?? 0} / ${result?.totalQuestions ?? 0}`, color: 'var(--neon-green)' },
              { label: 'BASE PTS', value: (result?.correctCount ?? 0) * 10, color: 'var(--cyan)' },
              { label: 'TIME BONUS', value: timeBonus, color: 'var(--warning)' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div className="font-orbitron" style={{ fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', fontWeight: 700, color: stat.color, marginBottom: '0.25rem' }}>
                  {stat.value}
                </div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Per-question review */}
          <div className="animate-fade-in-up delay-200">
            <h2 className="font-orbitron" style={{ fontSize: '0.85rem', color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              QUESTION BREAKDOWN
            </h2>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="cyber-table" style={{ minWidth: '560px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}>#</th>
                      <th>QUESTION</th>
                      <th>YOUR ANSWER</th>
                      <th>CORRECT</th>
                      <th>PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doneAnswers.map((a, i) => (
                      <tr key={a.questionId}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.question}</td>
                        <td>
                          {a.userAnswer === null ? (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>skipped</span>
                          ) : (
                            <span style={{ color: a.isCorrect ? 'var(--neon-green)' : 'var(--danger)' }}>
                              {a.isCorrect ? '✓' : '✗'} {a.userAnswer}: {a.options[a.userAnswer as keyof typeof a.options]}
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--neon-green)' }}>
                          {a.correctAnswer}: {a.options[a.correctAnswer as keyof typeof a.options]}
                        </td>
                        <td>
                          <span className="font-orbitron" style={{ color: 'var(--cyan)', fontSize: '0.8rem' }}>
                            {a.basePoints + a.timeBonus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="animate-fade-in-up delay-300" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <CyberButton variant="primary" onClick={() => router.push('/results')}>
              VIEW FULL RESULTS →
            </CyberButton>
            <CyberButton variant="danger" onClick={() => {
              sessionStorage.removeItem('quiz_user');
              sessionStorage.removeItem('quiz_result');
              router.replace('/');
            }}>
              EXIT QUIZ
            </CyberButton>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Auto-returning to home in{' '}
            <span className="font-orbitron" style={{ color: doneCountdown <= 10 ? 'var(--danger)' : 'var(--cyan)' }}>
              {doneCountdown}s
            </span>
          </div>
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
