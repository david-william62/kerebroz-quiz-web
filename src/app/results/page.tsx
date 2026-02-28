'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import GlowCard from '@/components/GlowCard';
import CyberButton from '@/components/CyberButton';

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

interface QuizResult {
  name: string;
  registerNo: string;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  answers: string; // JSON stringified AnswerRecord[]
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [countdown, setCountdown] = useState(30);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('quiz_user');
    sessionStorage.removeItem('quiz_result');
    router.replace('/');
  }, [router]);

  useEffect(() => {
    const raw = sessionStorage.getItem('quiz_result');
    if (!raw) {
      router.replace('/');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(parsed);
    } catch {
      router.replace('/');
    }
  }, [router]);

  // 30-second auto-logout countdown
  useEffect(() => {
    if (!result) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); handleLogout(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [result, handleLogout]);

  if (!result) return null;

  const answers: AnswerRecord[] = (() => {
    try { return JSON.parse(result.answers); } catch { return []; }
  })();

  const maxScore = result.totalQuestions * 20; // 10 base + 10 time bonus each
  const scorePct = maxScore > 0 ? Math.round((result.totalScore / maxScore) * 100) : 0;
  const timeBonus = answers.reduce((s, a) => s + a.timeBonus, 0);

  const scoreColor =
    scorePct >= 70 ? 'var(--neon-green)' :
      scorePct >= 40 ? 'var(--cyan)' : 'var(--danger)';

  const rankLabel =
    scorePct >= 80 ? '🏆 EXCEPTIONAL' :
      scorePct >= 60 ? '⚡ PROFICIENT' :
        scorePct >= 40 ? '🔷 COMPETENT' : '🔹 KEEP PRACTICING';

  return (
    <main style={{ minHeight: '100vh', position: 'relative', paddingBottom: '4rem' }}>
      <CircuitBackground />

      {/* Top bar */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-dim)',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span className="font-orbitron" style={{ color: 'var(--cyan)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
          EKTHA TECH QUIZ
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Auto-logout in{' '}
            <span className="font-orbitron" style={{ color: countdown <= 10 ? 'var(--danger)' : 'var(--cyan)' }}>
              {countdown}s
            </span>
          </span>
          <CyberButton variant="danger" onClick={handleLogout} style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}>
            LOGOUT NOW
          </CyberButton>
        </div>
      </div>

      <div
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: '720px', margin: '0 auto',
          padding: '2rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
        }}
      >
        {/* Hero score card */}
        <GlowCard glow className="animate-fade-in-up" style={{ textAlign: 'center' }}>
          <div className="badge badge-cyan" style={{ marginBottom: '1rem' }}>
            QUIZ COMPLETE
          </div>

          <div
            className="font-orbitron"
            style={{
              fontSize: 'clamp(3rem, 12vw, 5rem)',
              fontWeight: 900,
              color: scoreColor,
              textShadow: `0 0 24px ${scoreColor}80`,
              lineHeight: 1,
              marginBottom: '0.25rem',
            }}
          >
            {result.totalScore}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            out of {maxScore} points
          </div>

          {/* Score progress bar */}
          <div className="progress-bar-track" style={{ maxWidth: '300px', margin: '0 auto 1rem', height: '6px' }}>
            <div
              style={{
                height: '100%',
                width: `${scorePct}%`,
                background: scoreColor,
                borderRadius: '3px',
                boxShadow: `0 0 10px ${scoreColor}80`,
                transition: 'width 1.5s ease',
              }}
            />
          </div>

          <div
            className="font-orbitron"
            style={{ color: scoreColor, fontSize: '0.85rem', letterSpacing: '0.1em', marginBottom: '1.5rem' }}
          >
            {rankLabel}
          </div>

          <p style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
            {result.name}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
              ({result.registerNo})
            </span>
          </p>
        </GlowCard>

        {/* Breakdown row */}
        <div
          className="animate-fade-in-up delay-100"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}
        >
          {[
            { label: 'CORRECT', value: `${result.correctCount} / ${result.totalQuestions}`, color: 'var(--neon-green)' },
            { label: 'BASE PTS', value: result.correctCount * 10, color: 'var(--cyan)' },
            { label: 'TIME BONUS', value: timeBonus, color: 'var(--warning)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card"
              style={{ padding: '1rem', textAlign: 'center' }}
            >
              <div
                className="font-orbitron"
                style={{ fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', fontWeight: 700, color: stat.color, marginBottom: '0.25rem' }}
              >
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
          <h2
            className="font-orbitron"
            style={{ fontSize: '0.85rem', color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: '1rem' }}
          >
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
                    <th>POINTS</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.map((a, i) => (
                    <tr key={a.questionId}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.question}
                      </td>
                      <td>
                        {a.userAnswer === null ? (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>skipped</span>
                        ) : (
                          <span style={{ color: a.isCorrect ? 'var(--neon-green)' : 'var(--danger)' }}>
                            {a.userAnswer}: {a.options[a.userAnswer as keyof typeof a.options]}
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

        {/* Auto-logout note */}
        <div
          className="animate-fade-in-up delay-300"
          style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}
        >
          This session will auto-close in{' '}
          <span className="font-orbitron" style={{ color: countdown <= 10 ? 'var(--danger)' : 'var(--cyan)' }}>
            {countdown} seconds
          </span>
          .{' '}
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }}
          >
            Logout now
          </button>
        </div>
      </div>
    </main>
  );
}
