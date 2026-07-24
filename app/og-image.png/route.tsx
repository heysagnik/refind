import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F7F8F9',
          gap: '32px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Exact Logo matching public/icon.svg */}
        <div
          style={{
            width: '128px',
            height: '128px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(29, 78, 216, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 64 64"
            fill="none"
            style={{ position: 'relative', zIndex: 2 }}
          >
            <path
              d="M32 13 A12 12 0 0 1 44 25 C44 34 34 40 32 52 C30 40 20 34 20 25 A12 12 0 0 1 32 13 Z"
              fill="#FFFFFF"
            />
            <circle cx="32" cy="24" r="4.5" fill="#1D4ED8" />
          </svg>
        </div>

        {/* Text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#131517',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            MilGaya
          </span>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#64666A',
              marginTop: '4px',
              letterSpacing: '-0.01em',
            }}
          >
            Community Lost &amp; Found Platform
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
