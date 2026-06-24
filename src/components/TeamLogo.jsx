import { useState } from 'react'

// A team crest with a graceful fallback when no crest URL is available
// (free-text past bets, TBD knockout slots) or when the image fails to load.
// The fallback shows the team's first letter in a neutral chip.
export function TeamLogo({ crest, name, size = 20 }) {
  const [failed, setFailed] = useState(false)
  const px = `${size}px`

  if (crest && !failed) {
    return (
      <img
        src={crest}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className="inline-block shrink-0 object-contain"
        style={{ width: px, height: px }}
      />
    )
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-300"
      style={{ width: px, height: px }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </span>
  )
}

// "🏴 Home  vs  Away 🏴" — renders a match with both crests inline.
// Falls back to a plain label when team data isn't structured.
export function MatchTeams({
  home,
  away,
  homeCrest,
  awayCrest,
  label,
  size = 20,
  className = '',
}) {
  if (!home || !away) {
    return <span className={className}>{label}</span>
  }
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <TeamLogo crest={homeCrest} name={home} size={size} />
      <span>{home}</span>
      <span className="text-slate-500">vs</span>
      <TeamLogo crest={awayCrest} name={away} size={size} />
      <span>{away}</span>
    </span>
  )
}
