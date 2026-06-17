export const STATUS_META = {
  ongoing:  { cls: 'ongoing',  label: 'Ongoing',            iconKey: 'Refresh' },
  done:     { cls: 'done',     label: 'Selesai',            iconKey: 'Check' },
  paused:   { cls: 'paused',   label: 'Paused',             iconKey: 'Pause' },
  idle:     { cls: 'idle',     label: 'Idle',               iconKey: 'Sleep' },
  pending:  { cls: 'pending',  label: 'Menunggu',           iconKey: 'Hourglass' },
  waiting:  { cls: 'pending',  label: 'Menunggu Approval',  iconKey: 'Hourglass' },
  approved: { cls: 'done',     label: 'Approved',           iconKey: 'Check' },
  rejected: { cls: 'rejected', label: 'Rejected',           iconKey: 'Close' },
  queue:    { cls: 'ongoing',  label: 'Siap',               iconKey: 'Play' },
  over:     { cls: 'over',     label: 'Overtime',           iconKey: 'Warning' },
  deferred: { cls: 'paused',   label: 'Ditangguhkan',       iconKey: 'Hourglass' },
};

export const NAV = [
  { key: 'dashboard', label: 'Dashboard',         iconKey: 'Home',     roles: ['CEO', 'Member'] },
  { key: 'mytodo',    label: 'My Todo',            iconKey: 'Tasks',    roles: ['Member'] },
  { key: 'pending',   label: 'Menunggu Approval',  iconKey: 'Clock',    roles: ['Member'], badge: 'pending_member' },
  { key: 'selesai',   label: 'Selesai',            iconKey: 'Archive',  roles: ['Member'] },
  { key: 'approval',  label: 'Approval Queue',     iconKey: 'Approval', roles: ['CEO'], badge: 'pending' },
  { key: 'teamtodo',  label: 'Todo Tim',           iconKey: 'Users3',   roles: ['CEO'] },
  { key: 'laporan',   label: 'Laporan Harian',     iconKey: 'Chart',    roles: ['CEO', 'Member'] },
  { key: 'help',      label: 'Bantuan',            iconKey: 'Info',     roles: ['Member'] },
  { key: 'users',     label: 'User Management',    iconKey: 'People',   roles: ['CEO'] },
];

export const NAV_FOOT = [
  { key: 'settings', label: 'Settings', iconKey: 'Settings', roles: ['CEO', 'Member'] },
];

export const NOTIF_KIND = {
  TODO_APPROVED: 'ok', TODO_AUTO_APPROVED: 'ok',
  TODO_REJECTED: 'err',
  TODO_PENDING_APPROVAL: 'info',
  DELEGATION_CREATED: 'info', DELEGATION_REVOKED: 'info',
};

export const NOTIF_NAV = {
  TODO_APPROVED: '/mytodo', TODO_AUTO_APPROVED: '/mytodo',
  TODO_REJECTED: '/pending',
  TODO_PENDING_APPROVAL: '/approval',
  DELEGATION_CREATED: '/settings', DELEGATION_REVOKED: '/settings',
};
