'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CircuitBackground from '@/components/CircuitBackground';
import GlowCard from '@/components/GlowCard';
import CyberButton from '@/components/CyberButton';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [registerNo, setRegisterNo] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!registerNo.trim()) { setError('Please enter your register number.'); return; }
    if (!/^[A-Za-z0-9]+$/.test(registerNo.trim())) {
      setError('Register number should only contain letters and numbers.');
      return;
    }

    sessionStorage.setItem('quiz_user', JSON.stringify({ name: name.trim(), registerNo: registerNo.trim().toUpperCase() }));
    router.push('/quiz');
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CircuitBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        {/* Back link */}
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            textDecoration: 'none',
            fontFamily: 'Orbitron, monospace',
            letterSpacing: '0.08em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cyan)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ← HOME
        </Link>

        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Header */}
          <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>STEP 1 OF 2</div>
            <h1
              className="font-orbitron"
              style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: '0.4rem' }}
            >
              REGISTER
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Enter your details to begin the quiz
            </p>
          </div>

          {/* Form card */}
          <GlowCard glow className="animate-fade-in-up delay-100">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    color: 'var(--cyan)',
                    marginBottom: '0.5rem',
                  }}
                >
                  FULL NAME
                </label>
                <input
                  id="name"
                  type="text"
                  className="cyber-input"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  maxLength={80}
                />
              </div>

              <div>
                <label
                  htmlFor="registerNo"
                  style={{
                    display: 'block',
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    color: 'var(--cyan)',
                    marginBottom: '0.5rem',
                  }}
                >
                  REGISTER NUMBER
                </label>
                <input
                  id="registerNo"
                  type="text"
                  className="cyber-input"
                  placeholder="e.g. 22CS001"
                  value={registerNo}
                  onChange={(e) => setRegisterNo(e.target.value.toUpperCase())}
                  autoComplete="off"
                  maxLength={20}
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

              <CyberButton type="submit" variant="primary" fullWidth>
                ▶ START QUIZ
              </CyberButton>
            </form>
          </GlowCard>

          <p
            className="animate-fade-in-up delay-200"
            style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.25rem' }}
          >
            Your responses will be recorded for evaluation.
          </p>
        </div>
      </div>
    </main>
  );
}
