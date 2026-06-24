import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'gst.currentProfile'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  // Lazily restore the previously selected profile from localStorage so a
  // page refresh keeps the user "logged in" (no real auth in V1).
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [profile])

  const value = {
    profile,
    selectProfile: setProfile,
    clearProfile: () => setProfile(null),
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
