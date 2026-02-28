'use client';

export default function CircuitBackground() {
  return (
    <>
      {/* Grid overlay */}
      <div className="grid-bg" aria-hidden="true" />

      {/* Scanline overlay */}
      <div className="scanline-overlay" aria-hidden="true" />

      {/* Radial glow accents */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(ellipse 50% 40% at 80% 80%, rgba(57,255,20,0.04) 0%, transparent 70%)',
        }}
      />
    </>
  );
}
