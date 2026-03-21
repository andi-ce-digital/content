-- n8n „Create row“ macht nur INSERT. Bei erneutem Lauf mit gleicher (user_id, source_url)
-- soll die bestehende Zeile aktualisiert werden statt 409.
-- BEFORE INSERT: wenn Duplikat existiert -> UPDATE dieser Zeile, RETURN NULL (Insert wird verworfen).

CREATE OR REPLACE FUNCTION public.user_account_content_sync_and_merge()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_existing_id uuid;
BEGIN
  -- 1) user_id aus user_account (wie bisher)
  SELECT ua.user_id INTO v_owner
  FROM public.user_accounts ua
  WHERE ua.id = NEW.user_account_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'user_account_id % not found', NEW.user_account_id;
  END IF;

  IF NEW.user_id IS NOT NULL AND NEW.user_id <> v_owner THEN
    RAISE EXCEPTION 'user_id does not match user_accounts.user_id for this user_account_id';
  END IF;

  NEW.user_id := v_owner;

  -- 2) Nur INSERT: Duplikat (user_id + source_url) -> Merge
  IF TG_OP = 'INSERT'
     AND NEW.source_url IS NOT NULL
     AND length(trim(NEW.source_url)) > 0 THEN

    SELECT c.id INTO v_existing_id
    FROM public.user_account_content c
    WHERE c.user_id = NEW.user_id
      AND c.source_url = NEW.source_url
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      UPDATE public.user_account_content u
      SET
        user_account_id = NEW.user_account_id,
        platform = NEW.platform,
        creator_name = NEW.creator_name,
        creator_handle = NEW.creator_handle,
        source_url = NEW.source_url,
        content_type = NEW.content_type,
        title = NEW.title,
        caption = NEW.caption,
        transcript = NEW.transcript,
        hook = NEW.hook,
        first_sentence = NEW.first_sentence,
        cta = NEW.cta,
        views = NEW.views,
        likes = NEW.likes,
        comments = NEW.comments,
        shares = NEW.shares,
        duration_seconds = NEW.duration_seconds,
        topic = NEW.topic,
        content_angle = NEW.content_angle,
        hook_type = NEW.hook_type,
        framework_type = NEW.framework_type,
        engagement_rate = NEW.engagement_rate,
        performance_score = NEW.performance_score,
        published_at = NEW.published_at,
        platform_post_id = NEW.platform_post_id,
        shortcode = NEW.shortcode,
        media_url = NEW.media_url,
        thumbnail_url = NEW.thumbnail_url,
        creator_followers = NEW.creator_followers,
        creator_profile_url = NEW.creator_profile_url,
        hashtags = NEW.hashtags,
        mentions = NEW.mentions,
        tagged_users = NEW.tagged_users,
        location_name = NEW.location_name,
        location_id = NEW.location_id,
        video_view_count = NEW.video_view_count,
        video_duration = NEW.video_duration,
        thumbnail_width = NEW.thumbnail_width,
        thumbnail_height = NEW.thumbnail_height,
        hook_framework = NEW.hook_framework,
        opening_line = NEW.opening_line,
        main_message = NEW.main_message,
        primary_pain_point = NEW.primary_pain_point,
        primary_desire = NEW.primary_desire,
        viral_trigger = NEW.viral_trigger,
        storytelling_type = NEW.storytelling_type,
        content_stage = NEW.content_stage,
        content_format = NEW.content_format,
        target_audience = NEW.target_audience,
        emotion = NEW.emotion,
        pattern_interrupts = NEW.pattern_interrupts,
        cta_source = NEW.cta_source,
        hook_strength_score = NEW.hook_strength_score,
        viral_potential_score = NEW.viral_potential_score,
        like_rate = NEW.like_rate,
        comment_rate = NEW.comment_rate,
        save_rate = NEW.save_rate,
        share_rate = NEW.share_rate,
        reach_ratio = NEW.reach_ratio,
        transcript_detail = NEW.transcript_detail,
        hook_start = NEW.hook_start,
        hook_end = NEW.hook_end,
        hook_duration = NEW.hook_duration,
        cta_start = NEW.cta_start,
        cta_end = NEW.cta_end,
        body_duration = NEW.body_duration,
        time_to_hook = NEW.time_to_hook
      WHERE u.id = v_existing_id;

      RETURN NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_account_content_user_id ON public.user_account_content;

CREATE TRIGGER trg_user_account_content_sync_and_merge
  BEFORE INSERT OR UPDATE OF user_account_id, user_id
  ON public.user_account_content
  FOR EACH ROW
  EXECUTE FUNCTION user_account_content_sync_and_merge ();

-- Alte Funktion entfernen (wird durch neue ersetzt)
DROP FUNCTION IF EXISTS public.sync_user_account_content_user_id ();

COMMENT ON FUNCTION public.user_account_content_sync_and_merge () IS
  'Setzt user_id aus user_account_id; bei INSERT-Duplikat (user_id, source_url) UPDATE statt zweitem INSERT.';
