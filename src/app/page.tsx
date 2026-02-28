import Image from 'next/image';
import Link from 'next/link';
import CircuitBackground from '@/components/CircuitBackground';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CircuitBackground />

      {/* Content */}
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
          textAlign: 'center',
        }}
      >
        {/* Logos */}
        <div
          className="animate-fade-in-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2.5rem',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(0,240,255,0.15)',
              boxShadow: '0 0 24px rgba(0,240,255,0.08)',
            }}
          >
            <Image
              src="/cse-logo.svg"
              alt="CSE Department Logo"
              width={90}
              height={90}
              style={{ display: 'block' }}
              priority
            />
          </div>

          <div
            style={{
              width: '1px',
              height: '80px',
              background: 'linear-gradient(to bottom, transparent, rgba(0,240,255,0.4), transparent)',
            }}
          />

          <div
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(0,240,255,0.15)',
              boxShadow: '0 0 24px rgba(0,240,255,0.08)',
            }}
          >
            <Image
              src="/ektha-logo.png"
              alt="Ektha Logo"
              width={90}
              height={90}
              style={{ display: 'block', objectFit: 'contain' }}
              priority
            />
          </div>
        </div>

        {/* Event tag */}
        <div
          className="badge badge-cyan animate-fade-in-up delay-100"
          style={{ marginBottom: '1rem', fontSize: '0.7rem' }}
        >
          ◈ CSE DEPARTMENT PRESENTS
        </div>

        {/* Title */}
        <h1
          className="font-orbitron animate-glow-pulse animate-fade-in-up delay-200"
          style={{
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            fontWeight: 900,
            color: 'var(--cyan)',
            textShadow: '0 0 20px rgba(0,240,255,0.7), 0 0 60px rgba(0,240,255,0.3)',
            marginBottom: '0.5rem',
            lineHeight: 1.1,
          }}
        >
          EKTHA TECH QUIZ
        </h1>

        <p
          className="animate-fade-in-up delay-200"
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 'clamp(0.8rem, 2vw, 1rem)',
            color: 'var(--neon-green)',
            textShadow: '0 0 8px rgba(57,255,20,0.6)',
            letterSpacing: '0.3em',
            marginBottom: '1.5rem',
          }}
        >
          KNOWLEDGE • SPEED • PRECISION
        </p>

        {/* Description */}
        <p
          className="animate-fade-in-up delay-300"
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            maxWidth: '480px',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          Answer questions as fast as you can — your speed and accuracy both count
          toward your final score. May the sharpest mind win.
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up delay-400">
          <Link href="/register">
            <button className="cyber-btn cyber-btn-primary" style={{ fontSize: '0.9rem', padding: '0.85rem 2.5rem' }}>
              ▶ ENTER QUIZ
            </button>
          </Link>
        </div>

        {/* Decorative stats */}
        <div
          className="animate-fade-in-up delay-400"
          style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '3rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            { label: 'SCORING', value: 'SPEED + ACCURACY' },
            { label: 'FORMAT', value: 'MCQ' },
            { label: 'AUTO-LOGOUT', value: '30 SECONDS' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-dim)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                  marginBottom: '0.3rem',
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '0.8rem',
                  color: 'var(--cyan)',
                  fontWeight: 600,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '1rem',
          color: 'var(--text-muted)',
          fontSize: '0.72rem',
          borderTop: '1px solid var(--border-dim)',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        CSE Department · Ektha Technical Symposium
      </div>
    </main>
  );
}
