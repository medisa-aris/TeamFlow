-- ============================================================
-- TeamFlow — Initial Database Schema
-- SRS v1.1 — PostgreSQL 16
-- ============================================================

-- ============================================================
-- Shared trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ENUM Types
-- ============================================================
CREATE TYPE user_role AS ENUM ('MEMBER', 'CEO');

CREATE TYPE todo_status AS ENUM (
  'PENDING_APPROVAL',
  'PENDING_OVERTIME_APPROVAL',
  'APPROVED',
  'AUTO_APPROVED',
  'REJECTED',
  'ONGOING',
  'PAUSED',
  'DONE'
);

CREATE TYPE todo_trigger AS ENUM ('USER', 'SYSTEM', 'CEO', 'DELEGATE');

CREATE TYPE approval_action AS ENUM ('APPROVED', 'REJECTED', 'AUTO_APPROVED');

CREATE TYPE notification_type AS ENUM (
  'TODO_PENDING_APPROVAL',
  'TODO_APPROVED',
  'TODO_AUTO_APPROVED',
  'TODO_REJECTED',
  'DELEGATION_CREATED',
  'DELEGATION_REVOKED'
);

-- ============================================================
-- Table: users
-- ============================================================
CREATE TABLE users (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255)  NOT NULL,
  full_name       VARCHAR(255)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  role            user_role     NOT NULL DEFAULT 'MEMBER',
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  failed_login_attempts INT     NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE users IS 'System users — Members and CEO approvers';
COMMENT ON COLUMN users.locked_until IS 'Account locked until this time after 5 failed login attempts';

CREATE UNIQUE INDEX uix_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Table: approval_delegations
-- Description: Per-requestor delegation — CEO assigns a delegate
--              to approve todos from a specific Member.
-- ============================================================
CREATE TABLE approval_delegations (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  requestor_user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  delegate_user_id      UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  delegated_by_user_id  UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  active_from           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  active_until          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT chk_delegation_active_until_after_from
    CHECK (active_until IS NULL OR active_until > active_from),
  CONSTRAINT chk_delegation_not_self
    CHECK (requestor_user_id <> delegate_user_id)
);

COMMENT ON TABLE approval_delegations IS 'CEO-defined per-requestor approval delegation. One active delegation per requestor at most.';
COMMENT ON COLUMN approval_delegations.requestor_user_id IS 'The Member whose todos are being delegated';
COMMENT ON COLUMN approval_delegations.delegate_user_id IS 'The user who gains approval authority for this requestor';
COMMENT ON COLUMN approval_delegations.delegated_by_user_id IS 'Must be a CEO; the user who created this delegation';
COMMENT ON COLUMN approval_delegations.active_until IS 'NULL = currently active. Set on revocation.';

-- Only one active delegation per requestor at any time
CREATE UNIQUE INDEX uix_delegations_requestor_active
  ON approval_delegations(requestor_user_id)
  WHERE active_until IS NULL AND deleted_at IS NULL;

CREATE INDEX idx_delegations_requestor ON approval_delegations(requestor_user_id);
CREATE INDEX idx_delegations_delegate ON approval_delegations(delegate_user_id);

CREATE TRIGGER trg_approval_delegations_updated_at
  BEFORE UPDATE ON approval_delegations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Table: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255)  NOT NULL,
  expires_at      TIMESTAMPTZ   NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE refresh_tokens IS 'Refresh tokens for JWT session management';

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE TRIGGER trg_refresh_tokens_updated_at
  BEFORE UPDATE ON refresh_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Table: todos
-- ============================================================
CREATE TABLE todos (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title             VARCHAR(255)  NOT NULL,
  description       TEXT,
  estimated_hours   NUMERIC(3,1)  NOT NULL,
  status            todo_status   NOT NULL DEFAULT 'PENDING_APPROVAL',
  is_overtime       BOOLEAN       NOT NULL DEFAULT false,
  todo_date         DATE          NOT NULL DEFAULT CURRENT_DATE,
  total_seconds     INTEGER,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,

  CONSTRAINT chk_todos_estimated_hours
    CHECK (estimated_hours IN (0.5, 1.0, 1.5, 2.0)),

  -- Immutability: once DONE, status cannot change
  CONSTRAINT chk_todos_done_immutable
    CHECK (status <> 'DONE' OR (status = 'DONE' AND total_seconds IS NOT NULL))
);

COMMENT ON TABLE todos IS 'Task units created by Members, subject to approval workflow';
COMMENT ON COLUMN todos.status IS 'State machine enforced at service layer; DONE is terminal and immutable';
COMMENT ON COLUMN todos.todo_date IS 'Working-day date (Mon-Fri, WIB) this todo belongs to';
COMMENT ON COLUMN todos.total_seconds IS 'Set on DONE transition; sum of all session durations';

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_status ON todos(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_todos_todo_date ON todos(todo_date);
CREATE INDEX idx_todos_user_date ON todos(user_id, todo_date);

-- Enforce: only one ONGOING todo per user
CREATE UNIQUE INDEX uix_todos_user_ongoing
  ON todos(user_id)
  WHERE status = 'ONGOING' AND deleted_at IS NULL;

-- Default query view: excludes DONE and deleted
CREATE INDEX idx_todos_active ON todos(user_id, todo_date)
  WHERE status <> 'DONE' AND deleted_at IS NULL;

CREATE TRIGGER trg_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Table: todo_sessions
-- ============================================================
CREATE TABLE todo_sessions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id         UUID          NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ   NOT NULL,
  paused_at       TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  elapsed_seconds INTEGER,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT chk_sessions_paused_after_start
    CHECK (paused_at IS NULL OR paused_at > started_at),
  CONSTRAINT chk_sessions_completed_after_start
    CHECK (completed_at IS NULL OR completed_at > started_at),
  CONSTRAINT chk_sessions_not_both_closed
    CHECK (NOT (paused_at IS NOT NULL AND completed_at IS NOT NULL))
);

COMMENT ON TABLE todo_sessions IS 'Contiguous work periods within a todo';
COMMENT ON COLUMN todo_sessions.elapsed_seconds IS 'Computed on close: (paused_at OR completed_at) - started_at';

CREATE INDEX idx_todo_sessions_todo_id ON todo_sessions(todo_id);

CREATE TRIGGER trg_todo_sessions_updated_at
  BEFORE UPDATE ON todo_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Table: todo_events (immutable audit log)
-- ============================================================
CREATE TABLE todo_events (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id         UUID          NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  actor_user_id   UUID          REFERENCES users(id) ON DELETE SET NULL,
  from_status     todo_status,
  to_status       todo_status   NOT NULL,
  triggered_by    todo_trigger  NOT NULL DEFAULT 'USER',
  note            TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE todo_events IS 'Immutable audit log of all todo state transitions';
COMMENT ON COLUMN todo_events.triggered_by IS 'USER=member, CEO=direct approval, DELEGATE=delegated approval, SYSTEM=auto-approve';
COMMENT ON COLUMN todo_events.actor_user_id IS 'NULL when triggered_by = SYSTEM';

CREATE INDEX idx_todo_events_todo_id ON todo_events(todo_id);
CREATE INDEX idx_todo_events_actor ON todo_events(actor_user_id);
CREATE INDEX idx_todo_events_created_at ON todo_events(created_at);

CREATE TRIGGER trg_todo_events_updated_at
  BEFORE UPDATE ON todo_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Table: approval_logs
-- ============================================================
CREATE TABLE approval_logs (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id             UUID              NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  actor_user_id       UUID              REFERENCES users(id) ON DELETE SET NULL,
  action              approval_action   NOT NULL,
  reason              TEXT,
  is_delegate_action  BOOLEAN           NOT NULL DEFAULT false,
  actioned_at         TIMESTAMPTZ       NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

COMMENT ON TABLE approval_logs IS 'Record of CEO/delegate approval, rejection, or system auto-approval per todo';
COMMENT ON COLUMN approval_logs.is_delegate_action IS 'True when the actor is a delegate, not the CEO directly';
COMMENT ON COLUMN approval_logs.actor_user_id IS 'NULL when action = AUTO_APPROVED';

CREATE INDEX idx_approval_logs_todo_id ON approval_logs(todo_id);
CREATE INDEX idx_approval_logs_actor ON approval_logs(actor_user_id);
CREATE INDEX idx_approval_logs_actioned_at ON approval_logs(actioned_at);

CREATE TRIGGER trg_approval_logs_updated_at
  BEFORE UPDATE ON approval_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Table: notifications
-- Description: In-app notification records. Read-only once created.
-- ============================================================
CREATE TABLE notifications (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id   UUID                  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id       UUID                  REFERENCES users(id) ON DELETE SET NULL,
  todo_id             UUID                  REFERENCES todos(id) ON DELETE SET NULL,
  type                notification_type     NOT NULL,
  title               VARCHAR(255)          NOT NULL,
  body                TEXT                  NOT NULL,
  read_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ           NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

COMMENT ON TABLE notifications IS 'In-app notification records; immutable after creation; only read_at can be updated';
COMMENT ON COLUMN notifications.actor_user_id IS 'The user who triggered the notification event; NULL for system events';
COMMENT ON COLUMN notifications.read_at IS 'NULL = unread; set when user marks notification as read';

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_unread
  ON notifications(recipient_user_id)
  WHERE read_at IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Views
-- ============================================================

-- Daily hours per user — used by dashboard and reports
CREATE VIEW vw_daily_user_hours AS
SELECT
  t.user_id,
  t.todo_date,
  SUM(t.estimated_hours)
    FILTER (WHERE t.status NOT IN ('REJECTED', 'PENDING_APPROVAL', 'PENDING_OVERTIME_APPROVAL'))
    AS approved_hours,
  COALESCE(
    SUM(s.elapsed_seconds) FILTER (WHERE t.status = 'DONE'), 0
  ) / 3600.0 AS worked_hours
FROM todos t
LEFT JOIN todo_sessions s
  ON s.todo_id = t.id AND s.deleted_at IS NULL
WHERE t.deleted_at IS NULL
GROUP BY t.user_id, t.todo_date;

COMMENT ON VIEW vw_daily_user_hours IS 'Aggregated daily hours per user — working days only in application layer';

-- Active delegations — used by Delegation Module at runtime
CREATE VIEW vw_active_delegations AS
SELECT
  id,
  requestor_user_id,
  delegate_user_id,
  delegated_by_user_id,
  active_from
FROM approval_delegations
WHERE active_until IS NULL
  AND deleted_at IS NULL;

COMMENT ON VIEW vw_active_delegations IS 'Currently active per-requestor delegation mappings';
