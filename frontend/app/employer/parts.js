/* Presentational pieces shared by the search grid and the candidate profile.
   Markup mirrors the helpers in js/app.js (bar, fitRing, chip) so the employer
   site inherits the existing stylesheet unchanged. */

export function Bar({ value, maximum = 5, className = '' }) {
  const width = Math.max(0, Math.min(100, (100 * value) / maximum));
  return (
    <div className={`bar ${className}`} aria-hidden="true">
      <span style={{ '--fill': `${width}%` }} />
    </div>
  );
}

export function MatchRing({ value }) {
  return (
    <div className="fit-ring" title="Match against the selected role (illustrative demo)">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="27" />
        <circle cx="32" cy="32" r="27" pathLength="100" strokeDasharray={`${value} 100`} />
      </svg>
      <span>
        {value}%<span className="sr-only"> match against the selected role</span>
      </span>
    </div>
  );
}

/* Illustrative headshot from public/assets/personas; initials are the fallback. */
export function Avatar({ initials, photo, size = 'md' }) {
  return (
    <span className={`emp-avatar emp-avatar-${size}${photo ? ' emp-avatar-photo-wrap' : ''}`} aria-hidden="true">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="emp-avatar-photo" src={photo} alt="" width="96" height="96" loading="lazy" decoding="async" />
      ) : (
        initials
      )}
    </span>
  );
}

export function Chip({ children, accent = false }) {
  return <span className={`chip${accent ? ' chip-orange' : ''}`}>{children}</span>;
}
