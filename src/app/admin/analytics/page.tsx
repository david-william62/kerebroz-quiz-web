'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CircuitBackground from '@/components/CircuitBackground';
import GlowCard from '@/components/GlowCard';
import CyberButton from '@/components/CyberButton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';

interface QuizResponse {
  timestamp: string;
  name: string;
  registerNo: string;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  answers: string;
}

interface AnswerRecord {
  questionId: string;
  question: string;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
}

const CYAN = '#00F0FF';
const GREEN = '#39FF14';
const WARN = '#ffb800';

type Tab = 'overview' | 'participants' | 'questions';

// ── Tooltip customisation ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0e1520', border: '1px solid var(--border-glow)', borderRadius: '6px', padding: '0.5rem 0.9rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: CYAN, fontWeight: 700 }}>{payload[0].value}</div>
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [sortKey, setSortKey] = useState<'totalScore' | 'timestamp'>('totalScore');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetch('/api/results')
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) setResponses(d.responses ?? []);
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // ── Computed stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!responses.length) return null;
    const scores = responses.map((r) => r.totalScore);
    const total = responses.length;
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    // Score distribution buckets
    const buckets: Record<string, number> = {
      '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0, '100+': 0,
    };
    scores.forEach((s) => {
      if (s <= 20) buckets['0-20']++;
      else if (s <= 40) buckets['21-40']++;
      else if (s <= 60) buckets['41-60']++;
      else if (s <= 80) buckets['61-80']++;
      else if (s <= 100) buckets['81-100']++;
      else buckets['100+']++;
    });
    const scoreDistribution = Object.entries(buckets).map(([range, count]) => ({ range, count }));

    // Responses over time (by date)
    const byDate: Record<string, number> = {};
    responses.forEach((r) => {
      const date = new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      byDate[date] = (byDate[date] ?? 0) + 1;
    });
    const timelineData = Object.entries(byDate)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, count]) => ({ date, responses: count }));

    // Per-question accuracy
    const qStats: Record<string, { question: string; correct: number; total: number }> = {};
    responses.forEach((r) => {
      try {
        const answers: AnswerRecord[] = JSON.parse(r.answers);
        answers.forEach((a) => {
          if (!qStats[a.questionId]) {
            qStats[a.questionId] = { question: a.question, correct: 0, total: 0 };
          }
          qStats[a.questionId].total++;
          if (a.isCorrect) qStats[a.questionId].correct++;
        });
      } catch { /**/ }
    });
    const questionAccuracy = Object.entries(qStats).map(([id, s]) => ({
      id,
      question: s.question.length > 60 ? s.question.slice(0, 57) + '...' : s.question,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      correct: s.correct,
      total: s.total,
    }));

    return { total, avg, max, min, scoreDistribution, timelineData, questionAccuracy };
  }, [responses]);

  const sortedResponses = useMemo(() => {
    return [...responses].sort((a, b) => {
      const va = sortKey === 'totalScore' ? a.totalScore : new Date(a.timestamp).getTime();
      const vb = sortKey === 'totalScore' ? b.totalScore : new Date(b.timestamp).getTime();
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [responses, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      <CircuitBackground />

      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ position: 'relative', zIndex: 1, width: '220px', flexShrink: 0, padding: '1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div className="font-orbitron" style={{ color: 'var(--cyan)', fontSize: '0.8rem', letterSpacing: '0.1em', padding: '0.5rem 0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '1rem' }}>
          ADMIN PANEL
        </div>
        <Link href="/admin/questions" className="admin-nav-link">📋 Questions</Link>
        <Link href="/admin/analytics" className="admin-nav-link active">📊 Analytics</Link>
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} className="admin-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', width: '100%', textAlign: 'left' }}>
          ⏻ Logout
        </button>
      </aside>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, padding: '2rem 1.5rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 className="font-orbitron" style={{ color: 'var(--cyan)', fontSize: '1.1rem', letterSpacing: '0.08em' }}>ANALYTICS</h1>
          <CyberButton onClick={() => { setLoading(true); fetch('/api/results').then((r) => r.json()).then((d) => setResponses(d.responses ?? [])).finally(() => setLoading(false)); }} style={{ fontSize: '0.7rem', padding: '0.4rem 0.9rem' }}>
            ↺ REFRESH
          </CyberButton>
        </div>

        {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>Loading data...</div>}
        {error && <div style={{ color: 'var(--danger)' }}>⚠ {error}</div>}

        {!loading && !error && responses.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem', fontSize: '0.9rem' }}>
            No quiz responses yet. Results will appear here after participants complete the quiz.
          </div>
        )}

        {!loading && stats && (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'PARTICIPANTS', value: stats.total, color: CYAN },
                { label: 'AVG SCORE', value: stats.avg, color: GREEN },
                { label: 'TOP SCORE', value: stats.max, color: WARN },
                { label: 'MIN SCORE', value: stats.min, color: 'var(--danger)' },
              ].map((s) => (
                <div key={s.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div className="font-orbitron" style={{ fontSize: '2rem', fontWeight: 900, color: s.color, textShadow: `0 0 12px ${s.color}80` }}>
                    {s.value}
                  </div>
                  <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem' }}>
              {(['overview', 'participants', 'questions'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="font-orbitron"
                  style={{
                    background: tab === t ? 'rgba(0,240,255,0.1)' : 'transparent',
                    border: `1px solid ${tab === t ? 'var(--cyan)' : 'transparent'}`,
                    color: tab === t ? 'var(--cyan)' : 'var(--text-muted)',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    letterSpacing: '0.1em',
                    transition: 'all 0.2s',
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Overview charts */}
            {tab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Score distribution */}
                <GlowCard>
                  <h3 className="font-orbitron" style={{ fontSize: '0.75rem', color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
                    SCORE DISTRIBUTION
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.scoreDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="range" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#7a9ab0' }} />
                      <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#7a9ab0' }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={CYAN} radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </GlowCard>

                {/* Responses over time */}
                {stats.timelineData.length > 1 && (
                  <GlowCard>
                    <h3 className="font-orbitron" style={{ fontSize: '0.75rem', color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
                      PARTICIPATION OVER TIME
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={stats.timelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#7a9ab0' }} />
                        <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#7a9ab0' }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="responses" stroke={GREEN} strokeWidth={2} dot={{ fill: GREEN, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </GlowCard>
                )}
              </div>
            )}

            {/* Participants table */}
            {tab === 'participants' && (
              <GlowCard style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="cyber-table" style={{ minWidth: '640px' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>NAME</th>
                        <th>REGISTER NO</th>
                        <th
                          onClick={() => toggleSort('totalScore')}
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                          SCORE {sortKey === 'totalScore' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                        </th>
                        <th>CORRECT</th>
                        <th
                          onClick={() => toggleSort('timestamp')}
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                          TIME {sortKey === 'timestamp' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResponses.map((r, i) => (
                        <tr key={`${r.registerNo}-${r.timestamp}`}>
                          <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                          <td>{r.name}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{r.registerNo}</td>
                          <td>
                            <span className="font-orbitron" style={{ color: CYAN, fontWeight: 700 }}>{r.totalScore}</span>
                          </td>
                          <td>
                            <span style={{ color: GREEN }}>{r.correctCount}</span>
                            <span style={{ color: 'var(--text-muted)' }}> / {r.totalQuestions}</span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                            {new Date(r.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlowCard>
            )}

            {/* Per-question accuracy */}
            {tab === 'questions' && (
              <GlowCard>
                <h3 className="font-orbitron" style={{ fontSize: '0.75rem', color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
                  QUESTION ACCURACY
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.questionAccuracy.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No answer data yet.</p>
                  ) : (
                    stats.questionAccuracy.map((q, i) => (
                      <div key={q.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', gap: '1rem' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', flex: 1 }}>
                            <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>Q{i + 1}.</span>
                            {q.question}
                          </span>
                          <span
                            className="font-orbitron"
                            style={{
                              fontSize: '0.8rem',
                              flexShrink: 0,
                              color: q.accuracy >= 70 ? GREEN : q.accuracy >= 40 ? WARN : 'var(--danger)',
                            }}
                          >
                            {q.accuracy}%
                          </span>
                        </div>
                        <div className="progress-bar-track">
                          <div
                            style={{
                              height: '100%',
                              width: `${q.accuracy}%`,
                              background: q.accuracy >= 70 ? GREEN : q.accuracy >= 40 ? WARN : 'var(--danger)',
                              borderRadius: '2px',
                              transition: 'width 1s ease',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {q.correct} / {q.total} answered correctly
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlowCard>
            )}
          </>
        )}
      </div>
    </main>
  );
}
