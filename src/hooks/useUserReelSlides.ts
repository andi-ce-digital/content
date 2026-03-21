import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { shuffleArray, userAccountContentRowToSlide } from '../lib/userReelSlides'
import type { AiStudioReelSlide } from '../data/aiStudioReelSlides'

/**
 * Lädt die Reels des eingeloggten Users aus `user_account_content`,
 * mischt die Reihenfolge zufällig (pro Seitenaufruf).
 */
export function useUserReelSlides(): {
  slides: AiStudioReelSlide[]
  loading: boolean
} {
  const { user } = useAuth()
  const [slides, setSlides] = useState<AiStudioReelSlide[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !user) {
      setSlides([])
      setLoading(false)
      return
    }

    const client = supabase
    const userId = user.id

    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error } = await client
        .from('user_account_content')
        .select('id, title, caption, thumbnail_url, media_url, content_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (cancelled) return

      if (error || !data?.length) {
        setSlides([])
        setLoading(false)
        return
      }

      const rows = data as unknown as Record<string, unknown>[]
      const mapped = rows
        .map((row) => userAccountContentRowToSlide(row))
        .filter((s): s is AiStudioReelSlide => s != null)

      setSlides(shuffleArray(mapped))
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user])

  return { slides, loading }
}
