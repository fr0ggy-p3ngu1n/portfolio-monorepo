import { useId } from 'react';

// The MS signal mark (master: brand/logo/ms-mark.svg). Inline so it paints
// with the page instead of popping in after an image request.
export default function BrandMark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="51 51 410 410"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1="120" y1="400" x2="420" y2="150">
          <stop offset="0" stopColor="#EC4899" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id={`${id}-r`} gradientUnits="userSpaceOnUse" x1="66" y1="446" x2="446" y2="66">
          <stop offset="0" stopColor="#EC4899" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="190" fill="none" stroke={`url(#${id}-r)`} strokeOpacity="0.75" strokeWidth="10" />
      <g transform="translate(0 -8)">
        <path
          d="M 142 303.7 L 168 190 L 204 284 L 240 190 L 266 294 Q 274 330 308 330 L 338 330 Q 372 330 372 296 Q 372 262 338 262 L 318 262 Q 284 262 284 228 Q 284 194 318 194 L 357 194"
          fill="none"
          stroke={`url(#${id}-g)`}
          strokeWidth="26"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="136" cy="330" r="20" fill="none" stroke="#EC4899" strokeWidth="13" />
        <circle cx="384" cy="194" r="20" fill="none" stroke="#A78BFA" strokeWidth="13" />
      </g>
    </svg>
  );
}
