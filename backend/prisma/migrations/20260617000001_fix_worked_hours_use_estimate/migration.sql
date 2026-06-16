-- Fix vw_daily_user_hours: worked_hours should reflect estimated hours of DONE tasks,
-- not actual elapsed session time. This gives a clean "hours of work completed today"
-- metric that matches what managers expect from a daily report.
-- The session JOIN is no longer needed for this column.

CREATE OR REPLACE VIEW vw_daily_user_hours AS
SELECT
  t.user_id,
  t.todo_date,
  SUM(t.estimated_hours)
    FILTER (WHERE t.status NOT IN ('REJECTED', 'PENDING_APPROVAL', 'PENDING_OVERTIME_APPROVAL'))
    AS approved_hours,
  COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'DONE'), 0) AS worked_hours
FROM todos t
WHERE t.deleted_at IS NULL
GROUP BY t.user_id, t.todo_date;
