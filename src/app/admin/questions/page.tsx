'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import GlowCard from '@/components/GlowCard';
import CyberButton from '@/components/CyberButton';
import Link from 'next/link';

interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

const EMPTY_FORM = {
  question: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
};

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadQuestions = async () => {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch {
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuestions(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.question || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
      setError('All fields are required.'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSuccess('Question added!');
      setForm(EMPTY_FORM);
      loadQuestions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      const res = await fetch(`/api/questions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      loadQuestions();
    } catch {
      setError('Failed to delete question.');
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setSaving(true);

    import('papaparse').then((Papa) => {
      Papa.default.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as Record<string, string>[];
          const parsedQuestions = rows.map((row) => ({
            question: row.Question || row.question || '',
            optionA: row['Option A'] || row.optionA || '',
            optionB: row['Option B'] || row.optionB || '',
            optionC: row['Option C'] || row.optionC || '',
            optionD: row['Option D'] || row.optionD || '',
            correctAnswer: (row['Correct Answer'] || row.correctAnswer || 'A').toString().toUpperCase().trim(),
          })).filter((q: { question: string, optionA: string, optionB: string, optionC: string, optionD: string, correctAnswer: string }) => q.question && q.optionA && q.optionB && q.optionC && q.optionD && ['A', 'B', 'C', 'D'].includes(q.correctAnswer));

          if (parsedQuestions.length === 0) {
            setError('No valid questions found in CSV. Ensure columns match: Question, Option A, Option B, Option C, Option D, Correct Answer');
            setSaving(false);
            return;
          }

          try {
            const res = await fetch('/api/questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ questions: parsedQuestions }),
            });
            if (!res.ok) {
              const d = await res.json();
              throw new Error(d.error);
            }
            setSuccess(`Successfully imported ${parsedQuestions.length} questions from CSV!`);
            loadQuestions();
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to import questions');
          } finally {
            setSaving(false);
            e.target.value = ''; // reset input
          }
        },
        error: () => {
          setError('Failed to parse CSV file.');
          setSaving(false);
        }
      });
    });
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-dim)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.85rem',
    padding: '0.55rem 0.85rem',
    width: '100%',
    outline: 'none',
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      <CircuitBackground />

      {/* Sidebar */}
      <aside
        className="admin-sidebar"
        style={{ position: 'relative', zIndex: 1, width: '220px', flexShrink: 0, padding: '1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
      >
        <div
          className="font-orbitron"
          style={{ color: 'var(--cyan)', fontSize: '0.8rem', letterSpacing: '0.1em', padding: '0.5rem 0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '1rem' }}
        >
          ADMIN PANEL
        </div>
        <Link href="/admin/questions" className="admin-nav-link active">📋 Questions</Link>
        <Link href="/admin/analytics" className="admin-nav-link">📊 Analytics</Link>
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} className="admin-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', width: '100%', textAlign: 'left' }}>
          ⏻ Logout
        </button>
      </aside>

      {/* Main */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, padding: '2rem 1.5rem', overflowY: 'auto' }}>
        <h1 className="font-orbitron" style={{ color: 'var(--cyan)', fontSize: '1.1rem', marginBottom: '1.5rem', letterSpacing: '0.08em' }}>
          MANAGE QUESTIONS
        </h1>

        {/* Add question form */}
        <GlowCard className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="font-orbitron" style={{ color: 'var(--text-primary)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
              ADD NEW QUESTION
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="csv-upload" style={{ cursor: 'pointer' }}>
                <div className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem' }}>
                  {saving ? 'UPLOADING...' : '📄 UPLOAD CSV'}
                </div>
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                disabled={saving}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="font-orbitron" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--cyan)', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>QUESTION</label>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                placeholder="Enter the question text..."
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <div key={opt}>
                  <label className="font-orbitron" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                    OPTION {opt}
                  </label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder={`Option ${opt}`}
                    value={form[`option${opt}` as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="font-orbitron" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--neon-green)', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                CORRECT ANSWER
              </label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
              >
                {(['A', 'B', 'C', 'D'] as const).map((o) => (
                  <option key={o} value={o} style={{ background: 'var(--bg-dark)' }}>{o}</option>
                ))}
              </select>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>⚠ {error}</div>}
            {success && <div style={{ color: 'var(--neon-green)', fontSize: '0.82rem' }}>✓ {success}</div>}

            <CyberButton type="submit" variant="primary" disabled={saving}>
              {saving ? 'SAVING...' : '+ ADD QUESTION'}
            </CyberButton>
          </form>
        </GlowCard>

        {/* Questions table */}
        <GlowCard className="animate-fade-in-up delay-100" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="font-orbitron" style={{ fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
              ALL QUESTIONS <span className="badge badge-cyan" style={{ marginLeft: '0.5rem' }}>{questions.length}</span>
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : questions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No questions yet. Add your first question above.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="cyber-table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '32px' }}>#</th>
                    <th>QUESTION</th>
                    <th>OPTIONS</th>
                    <th>ANSWER</th>
                    <th style={{ width: '80px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={q.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ maxWidth: '260px' }}>{q.question}</td>
                      <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        A: {q.optionA} · B: {q.optionB} · C: {q.optionC} · D: {q.optionD}
                      </td>
                      <td>
                        <span className="badge badge-green">{q.correctAnswer}</span>
                      </td>
                      <td>
                        <CyberButton
                          variant="danger"
                          onClick={() => handleDelete(q.id)}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.68rem' }}
                        >
                          DEL
                        </CyberButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlowCard>
      </div>
    </main>
  );
}
