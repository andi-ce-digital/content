import type { AiStudioReelSlide } from '../data/aiStudioReelSlides'

/** Fisher–Yates: neue gemischte Kopie */
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function isProbablyVideoUrl(url: string): boolean {
  const path = url.split('?')[0].toLowerCase()
  if (/\.(mp4|webm|mov|m4v|mkv|avi)$/.test(path)) return true
  if (path.includes('/video/') || path.includes('video.')) return true
  return false
}

function looksLikeVideoFromContentType(contentType: string): boolean {
  const t = contentType.toLowerCase()
  return t.includes('video') || t.includes('reel') || t.includes('clip')
}

/**
 * Mappt eine Zeile aus `user_account_content` auf einen Diashow-Slide.
 * Thumbnail bevorzugt; sonst Bild-URL; sonst Video-URL (stumm in der Showcase).
 */
export function userAccountContentRowToSlide(
  row: Record<string, unknown>,
): AiStudioReelSlide | null {
  const id = row.id != null ? String(row.id) : ''
  if (!id) return null

  const title = row.title != null ? String(row.title).trim() : ''
  const caption = row.caption != null ? String(row.caption).trim() : ''
  const alt = title || caption || 'Dein Reel'

  const thumb = row.thumbnail_url != null ? String(row.thumbnail_url).trim() : ''
  const media = row.media_url != null ? String(row.media_url).trim() : ''
  const contentType =
    row.content_type != null ? String(row.content_type) : ''

  if (thumb) {
    return {
      id,
      alt,
      imageUrl: thumb,
      videoUrl: null,
    }
  }

  if (media) {
    if (isProbablyVideoUrl(media) || looksLikeVideoFromContentType(contentType)) {
      return { id, alt, imageUrl: null, videoUrl: media }
    }
    return { id, alt, imageUrl: media, videoUrl: null }
  }

  return null
}
