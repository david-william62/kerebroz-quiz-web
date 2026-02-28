'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import GlowCard from '@/components/GlowCard';
import CyberButton from '@/components/CyberButton';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin/questions');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Invalid credentials. Access denied.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '2rem 1rem',
      }}
    >
      <CircuitBackground />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px', height: '56px',
              borderRadius: '12px',
              border: '1px solid var(--border-glow)',
              background: 'rgba(0,240,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.5rem',
            }}
          >
            🔐
          </div>
          <h1
            className="font-orbitron"
            style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: '0.3rem' }}
          >
            ADMIN ACCESS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Coordinator login — Ektha Tech Quiz
          </p>
        </div>

        {/* Login card */}
        <GlowCard glow className="animate-fade-in-up delay-100">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '0.68rem',
                  letterSpacing: '0.1em',
                  color: 'var(--cyan)',
                  marginBottom: '0.5rem',
                }}
              >
                USER ID
              </label>
              <div
                className="cyber-input"
                style={{
                  color: 'var(--text-muted)',
                  cursor: 'default',
                  userSelect: 'none',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                tech-quizz-admin
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '0.68rem',
                  letterSpacing: '0.1em',
                  color: 'var(--cyan)',
                  marginBottom: '0.5rem',
                }}
              >
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                className="cyber-input"
                placeholder="Enter coordinator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '0.6rem 0.9rem',
                  borderRadius: '6px',
                  background: 'rgba(255,59,92,0.1)',
                  border: '1px solid rgba(255,59,92,0.3)',
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                }}
              >
                ⚠ {error}
              </div>
            )}

            <CyberButton type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'VERIFYING...' : '▶ LOGIN'}
            </CyberButton>
          </form>
        </GlowCard>
      </div>
    </main>
  );
}
