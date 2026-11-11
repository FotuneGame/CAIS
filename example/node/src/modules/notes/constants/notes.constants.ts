export const CACHE_KEY = 'notes:list';

export const TOPIC = 'notes.created';

export const INDEX = 'notes';

export const EVENTS_TABLE = `CREATE TABLE IF NOT EXISTS note_events (
  note_id UInt32,
  title String,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree ORDER BY created_at`;

export const STATS_QUERY = `SELECT toDate(created_at) AS day, count() AS notes
  FROM note_events GROUP BY day ORDER BY day`;
