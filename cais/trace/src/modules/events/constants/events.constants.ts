export const EVENTS_TABLE = (
  keepDays: number,
) => `CREATE TABLE IF NOT EXISTS cais_events (
  time DateTime64(3, 'UTC'), agent String, type String, run String,
  tool String, decision String, status String, durationMs Nullable(Float64)
) ENGINE = MergeTree ORDER BY time
TTL toDateTime(time) + INTERVAL ${keepDays} DAY`;

export const EVENTS_QUERY = `SELECT * FROM (SELECT * FROM cais_events
  WHERE ({agent:String} = '' OR agent = {agent:String})
    AND ({minutes:UInt32} = 0 OR time >= now64(3) - toIntervalMinute({minutes:UInt32}))
  ORDER BY time DESC LIMIT {limit:UInt32}) ORDER BY time`;
