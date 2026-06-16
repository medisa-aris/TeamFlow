-- Fix vw_daily_user_hours to only count session elapsed_seconds
-- for sessions that started within the todo's todo_date (WIB / Asia/Jakarta).
-- This prevents carryover and reactivated todos from pulling old session times
-- into the current day's worked_hours total.

CREATE OR REPLACE VIEW vw_daily_user_hours AS
SELECT
  t.user_id,
  t.todo_date,
  SUM(t.estimated_hours)
    FILTER (WHERE t.status NOT IN ('REJECTED', 'PENDING_APPROVAL', 'PENDING_OVERTIME_APPROVAL'))
    AS approved_hours,
  COALESCE(
    SUM(s.elapsed_seconds) FILTER (
      WHERE t.status = 'DONE'
        AND (s.started_at AT TIME ZONE 'Asia/Jakarta')::date = t.todo_date
    ), 0
  ) / 3600.0 AS worked_hours
FROM todos t
LEFT JOIN todo_sessions s
  ON s.todo_id = t.id AND s.deleted_at IS NULL
WHERE t.deleted_at IS NULL
GROUP BY t.user_id, t.todo_date;
