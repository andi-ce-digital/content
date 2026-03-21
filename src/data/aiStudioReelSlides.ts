/**
 * Reel-Diashow im KI-Studio.
 * Daten kommen aus `user_account_content` (eigene importierte Reels) – siehe `useUserReelSlides`.
 */
export type AiStudioReelSlide = {
  /** UUID aus user_account_content (React keys) */
  id: string
  alt: string
  /** Thumbnail oder statisches Bild */
  imageUrl: string | null
  /** Nur wenn kein Bild: reel-Video (MP4 etc.), stumm */
  videoUrl: string | null
}
