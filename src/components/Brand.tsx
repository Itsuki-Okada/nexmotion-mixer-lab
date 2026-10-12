/** Fictional brand mark: a three-blade rotor inside a precision ring. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="brandmark">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <g fill="currentColor">
        {[0, 120, 240].map((a) => (
          <path key={a} transform={`rotate(${a} 16 16)`} d="M16 16 C 17 10, 21 6.5, 25.5 7.5 C 23 10, 20.5 13.5, 16 16 Z" />
        ))}
      </g>
      <circle cx="16" cy="16" r="2.2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
