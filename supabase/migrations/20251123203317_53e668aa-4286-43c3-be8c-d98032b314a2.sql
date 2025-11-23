-- Add observation field to timeline_events table
ALTER TABLE public.timeline_events 
ADD COLUMN observation text;

COMMENT ON COLUMN public.timeline_events.observation IS 'Optional observation/notes for the timeline event';