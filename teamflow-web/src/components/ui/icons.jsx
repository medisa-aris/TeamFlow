'use client';

const Ic = ({ d, size = 16, sw = 1.5, fill = 'none', vb = 24, children, style }) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
       style={style} aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);

export const Icons = {
  Home:        (p) => <Ic {...p} d="M4 11.5 12 4l8 7.5M6 10v9h4v-5h4v5h4v-9" />,
  Tasks:       (p) => <Ic {...p}><path d="M9 5h11M9 12h11M9 19h11"/><path d="m3.5 5 1.2 1.2L7 4"/><path d="m3.5 12 1.2 1.2L7 11"/><path d="m3.5 19 1.2 1.2L7 18"/></Ic>,
  Approval:    (p) => <Ic {...p}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6v2.5H9z"/><path d="m8.5 13 2 2 4-4"/></Ic>,
  Chart:       (p) => <Ic {...p}><path d="M4 4v16h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12.5" y="7" width="3" height="10"/><rect x="18" y="13" width="3" height="4" transform="translate(-1 0)"/></Ic>,
  People:      (p) => <Ic {...p}><circle cx="9" cy="8" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="8.5" r="2.3"/><path d="M16 13.6c2.6.2 4.5 2.1 4.5 4.9"/></Ic>,
  Settings:    (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3"/></Ic>,
  Bell:        (p) => <Ic {...p}><path d="M18 16H6l1.4-2v-4a4.6 4.6 0 0 1 9.2 0v4z"/><path d="M10 19a2 2 0 0 0 4 0"/></Ic>,
  Search:      (p) => <Ic {...p}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></Ic>,
  Plus:        (p) => <Ic {...p} d="M12 5v14M5 12h14" />,
  Play:        (p) => <Ic {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z"/></Ic>,
  Pause:       (p) => <Ic {...p} fill="currentColor" stroke="none"><rect x="7" y="5.5" width="3.4" height="13" rx="1"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1"/></Ic>,
  Check:       (p) => <Ic {...p} d="M5 12.5 9.5 17 19 7" sw={2} />,
  CheckCircle: (p) => <Ic {...p}><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4L15.8 9.5"/></Ic>,
  XCircle:     (p) => <Ic {...p}><circle cx="12" cy="12" r="8.5"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/></Ic>,
  Close:       (p) => <Ic {...p} d="M6 6l12 12M18 6 6 18" />,
  Chevron:     (p) => <Ic {...p} d="m6 9 6 6 6-6" />,
  ChevronRight:(p) => <Ic {...p} d="m9 6 6 6-6 6" />,
  ArrowLeft:   (p) => <Ic {...p} d="M19 12H5M11 6l-6 6 6 6" />,
  ArrowRight:  (p) => <Ic {...p} d="M5 12h14M13 6l6 6-6 6" />,
  Menu:        (p) => <Ic {...p} d="M4 6h16M4 12h16M4 18h16" />,
  Sun:         (p) => <Ic {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"/></Ic>,
  Moon:        (p) => <Ic {...p} d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  Filter:      (p) => <Ic {...p} d="M4 5h16l-6.2 7.4V19l-3.6 2v-8.6z" />,
  Edit:        (p) => <Ic {...p}><path d="M4 20h4l10-10-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></Ic>,
  Trash:       (p) => <Ic {...p}><path d="M5 7h14M10 7V5h4v2M6.5 7l1 12h9l1-12"/></Ic>,
  Clock:       (p) => <Ic {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></Ic>,
  Calendar:    (p) => <Ic {...p}><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/></Ic>,
  Logout:      (p) => <Ic {...p}><path d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4"/><path d="M10 12H3M6 8l-3 4 3 4"/></Ic>,
  Mail:        (p) => <Ic {...p}><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></Ic>,
  Lock:        (p) => <Ic {...p}><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></Ic>,
  Eye:         (p) => <Ic {...p}><ellipse cx="12" cy="12" rx="8" ry="5"/><circle cx="12" cy="12" r="2.5"/></Ic>,
  EyeOff:      (p) => <Ic {...p}><path d="M3 3l18 18M10.5 10.7A3 3 0 0 0 13.3 13.5"/><path d="M6.3 6.5C4.5 7.8 3 9.8 3 12c0 3.3 4 7 9 7a9.6 9.6 0 0 0 5.7-1.9M9.5 4.4A9.1 9.1 0 0 1 12 4c5 0 9 3.7 9 8 0 1.4-.5 2.8-1.4 4"/></Ic>,
  Users3:      (p) => <Ic {...p}><circle cx="12" cy="8" r="3"/><path d="M6 19c0-3.3 2.7-6 6-6s6 2.7 6 6"/></Ic>,
  Hourglass:   (p) => <Ic {...p}><path d="M7 4h10M7 20h10M8 4c0 4 8 4 8 8s-8 4-8 8M16 4c0 4-8 4-8 8s8 4 8 8"/></Ic>,
  Refresh:     (p) => <Ic {...p}><path d="M20 11a8 8 0 0 0-14-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14 4.5L20 16"/><path d="M20 20v-4h-4"/></Ic>,
  Sleep:       (p) => <Ic {...p}><path d="M6 8h5l-5 6h5"/><path d="M14 5h4l-4 5h4"/></Ic>,
  Camera:      (p) => <Ic {...p}><rect x="3.5" y="7" width="17" height="12" rx="2"/><circle cx="12" cy="13" r="3.2"/><path d="M8.5 7l1.2-2h4.6L15.5 7"/></Ic>,
  Warning:     (p) => <Ic {...p}><path d="M12 4 21 19H3z"/><path d="M12 10v4M12 16.5v.5"/></Ic>,
  Info:        (p) => <Ic {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.5"/></Ic>,
  Flag:        (p) => <Ic {...p}><path d="M6 21V4M6 5h11l-2 3 2 3H6"/></Ic>,
  Bolt:        (p) => <Ic {...p} fill="currentColor" stroke="none"><path d="M13 2 4 13h6l-1 9 9-12h-6z"/></Ic>,
  Pin:         (p) => <Ic {...p}><path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10z"/><circle cx="12" cy="11" r="2.2"/></Ic>,
  Dot:         (p) => <Ic {...p} fill="currentColor" stroke="none"><circle cx="12" cy="12" r="4"/></Ic>,
  Building:    (p) => <Ic {...p}><path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11M8 8h2M8 12h2M8 16h2"/></Ic>,
  Spinner:     (p) => <Ic {...p} fill="none"><circle cx="12" cy="12" r="8.5" strokeOpacity=".25"/><path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" strokeOpacity="1"/></Ic>,
  Archive:     (p) => <Ic {...p}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></Ic>,
  Download:    (p) => <Ic {...p} d="M12 3v12M8 11l4 4 4-4M3 18h18" />,
};
