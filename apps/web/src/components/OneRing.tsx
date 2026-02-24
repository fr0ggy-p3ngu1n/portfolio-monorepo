// A stylized SVG One Ring — golden band with glowing inscription
export default function OneRing({ size = 220 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.28;
  const midR   = (outerR + innerR) / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 0 24px #c8960c) drop-shadow(0 0 8px #f5d060)' }}
    >
      <defs>
        {/* Gold gradient wrapping around the band */}
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f5e87a" />
          <stop offset="18%"  stopColor="#c8960c" />
          <stop offset="38%"  stopColor="#f0c040" />
          <stop offset="55%"  stopColor="#8b6000" />
          <stop offset="72%"  stopColor="#e8b430" />
          <stop offset="88%"  stopColor="#c8960c" />
          <stop offset="100%" stopColor="#f5e87a" />
        </linearGradient>

        {/* Soft inner highlight */}
        <radialGradient id="shine" cx="38%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="#fff9c0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c8960c" stopOpacity="0"   />
        </radialGradient>

        {/* Path for inscription text — runs along the centre of the band */}
        <path
          id="inscribePath"
          d={`
            M ${cx},${cy}
            m -${midR},0
            a ${midR},${midR} 0 1,1 ${midR * 2},0
            a ${midR},${midR} 0 1,1 -${midR * 2},0
          `}
          fill="none"
        />
      </defs>

      {/* Outer glow ring */}
      <circle
        cx={cx} cy={cy}
        r={outerR + size * 0.06}
        fill="none"
        stroke="#c8960c"
        strokeWidth={size * 0.04}
        opacity="0.18"
      />

      {/* Main band — filled annulus */}
      <circle cx={cx} cy={cy} r={outerR} fill="url(#gold)" />
      <circle cx={cx} cy={cy} r={innerR} fill="#0a0a0a" />

      {/* Shine overlay on band */}
      <circle cx={cx} cy={cy} r={outerR} fill="url(#shine)" />
      {/* Inner edge highlight */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#f5d060" strokeWidth="1.5" opacity="0.5" />
      {/* Outer edge highlight */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#f5e87a" strokeWidth="1"   opacity="0.4" />

      {/* Black Speech inscription along the band */}
      <text
        fontSize={size * 0.055}
        fill="#1a0d00"
        fontFamily="serif"
        letterSpacing={size * 0.018}
        opacity="0.75"
      >
        <textPath href="#inscribePath" startOffset="0%">
          ash nazg durbatulûk ᚩ ash nazg gimbatul ᚩ ash nazg thrakatulûk ᚩ
        </textPath>
      </text>
    </svg>
  );
}
