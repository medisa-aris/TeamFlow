'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/apiClient';
import { mapReportDetail, getLocalDate } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card, SectionLabel, Avatar } from '@/components/ui/primitives';
import { MultiSelectDropdown } from '@/components/features/MultiSelectDropdown';

const PERIOD_KEY = { 'Minggu ini': 'this_week', 'Minggu lalu': 'last_week', 'Bulan ini': 'this_month' };
const PERIOD_TITLE = { 'Minggu ini': 'Ringkasan Minggu Ini', 'Minggu lalu': 'Ringkasan Minggu Lalu', 'Bulan ini': 'Ringkasan Bulan Ini' };

function fmtShortDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function buildRingSVG(title, subtitle, columns, rows) {
  const pad = 20, colW = 54, rowH = 34, nameW = 120, totalW = 68;
  const headerH = 52, tblHH = 30;
  const W = pad * 2 + nameW + colW * columns.length + totalW;
  const H = pad + headerH + tblHH + (rows.length + 1) * rowH + pad;
  const bg = '#ffffff', text = '#111', dim = '#777', accent = '#6b4fbb', divider = '#e5e5e5';
  const xCol = (i) => pad + nameW + colW * i;
  const yRow = (i) => pad + headerH + tblHH + rowH * i;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  s += `<rect width="${W}" height="${H}" fill="${bg}" rx="10"/>`;
  s += `<text x="${pad}" y="${pad + 20}" font-size="15" font-weight="700" font-family="sans-serif" fill="${text}">${title}</text>`;
  s += `<text x="${pad}" y="${pad + 38}" font-size="11" font-family="sans-serif" fill="${dim}">${subtitle}</text>`;
  s += `<rect x="${pad}" y="${pad + headerH}" width="${W - pad * 2}" height="${tblHH}" fill="#f5f5f5" rx="5"/>`;
  s += `<text x="${pad + 8}" y="${pad + headerH + 20}" font-size="11" font-family="sans-serif" fill="${dim}">Anggota</text>`;
  columns.forEach((col, i) => {
    s += `<text x="${xCol(i) + colW / 2}" y="${pad + headerH + 20}" font-size="11" font-family="sans-serif" fill="${dim}" text-anchor="middle">${col}</text>`;
  });
  s += `<text x="${xCol(columns.length) + totalW / 2}" y="${pad + headerH + 20}" font-size="11" font-family="sans-serif" fill="${dim}" text-anchor="middle">Total</text>`;
  rows.forEach((r, ri) => {
    const ry = yRow(ri);
    if (ri % 2 === 1) s += `<rect x="${pad}" y="${ry}" width="${W - pad * 2}" height="${rowH}" fill="#fafafa"/>`;
    s += `<line x1="${pad}" y1="${ry}" x2="${W - pad}" y2="${ry}" stroke="${divider}"/>`;
    const first = (r.fullName || '').split(' ')[0];
    s += `<text x="${pad + 8}" y="${ry + rowH / 2 + 5}" font-size="13" font-family="sans-serif" fill="${text}" font-weight="600">${first}</text>`;
    r.days.forEach((h, ci) => {
      const label = h > 0 ? String(h) : '–';
      const c = h >= 8 ? accent : h > 0 ? text : dim;
      s += `<text x="${xCol(ci) + colW / 2}" y="${ry + rowH / 2 + 5}" font-size="13" font-family="sans-serif" fill="${c}" text-anchor="middle" font-weight="${h >= 8 ? '700' : '400'}">${label}</text>`;
    });
    const total = Math.round(r.days.reduce((a, b) => a + b, 0) * 10) / 10;
    s += `<text x="${xCol(columns.length) + totalW / 2}" y="${ry + rowH / 2 + 5}" font-size="13" font-family="sans-serif" fill="${text}" text-anchor="middle" font-weight="700">${total}</text>`;
  });
  const footY = yRow(rows.length);
  s += `<line x1="${pad}" y1="${footY}" x2="${W - pad}" y2="${footY}" stroke="${text}" stroke-width="2"/>`;
  s += `<text x="${pad + 8}" y="${footY + rowH / 2 + 5}" font-size="13" font-family="sans-serif" fill="${text}" font-weight="700">Total</text>`;
  columns.forEach((_, ci) => {
    const colSum = Math.round(rows.reduce((a, r) => a + (r.days[ci] || 0), 0) * 10) / 10;
    s += `<text x="${xCol(ci) + colW / 2}" y="${footY + rowH / 2 + 5}" font-size="13" font-family="sans-serif" fill="${text}" text-anchor="middle" font-weight="700">${colSum > 0 ? colSum : '–'}</text>`;
  });
  const grandTotal = Math.round(rows.reduce((a, r) => a + r.days.reduce((x, y) => x + y, 0), 0) * 10) / 10;
  s += `<text x="${xCol(columns.length) + totalW / 2}" y="${footY + rowH / 2 + 5}" font-size="13" font-family="sans-serif" fill="${text}" text-anchor="middle" font-weight="700">${grandTotal}</text>`;
  s += '</svg>';
  return s;
}

function ReportDetailCard({ p }) {
  return (
    <Card hover>
      <div className="row gap12" style={{ marginBottom: 10 }}>
        <Avatar first={p.first} size={30} />
        <span className="t-body-strong" style={{ flex: 1 }}>{p.name || p.first}</span>
        <span className="badge" style={{ color: 'var(--accent)', background: 'color-mix(in srgb,var(--accent) 13%,transparent)' }}>{p.used}/8 jam</span>
      </div>
      <div className="col" style={{ gap: 8 }}>
        {p.items.map((it, i) => {
          const stateIcon = it.state === 'done'
            ? <Icons.CheckCircle size={15} style={{ color: '#0f7b3f' }} />
            : it.state === 'ongoing'
              ? <Icons.Refresh size={14} className="spin accent-text" />
              : it.state === 'rejected'
                ? <Icons.XCircle size={15} style={{ color: '#c42b1c' }} />
                : it.state === 'deferred'
                  ? <Icons.Hourglass size={14} style={{ color: '#c8650a' }} />
                  : <Icons.Clock size={14} className="dim2" />;
          const barVariant = it.state === 'done' ? 'full' : it.state === 'rejected' ? 'warn' : '';
          return (
            <div key={i} className="row gap12">
              <span className="dim2 t-caption" style={{ width: 44 }}>{it.time}</span>
              <span className="t-body" style={{ flex: 1, minWidth: 0, opacity: it.state === 'rejected' ? 0.55 : 1 }}>{it.task}</span>
              <div style={{ width: 80 }}>
                <div className={`pbar`}><i className={barVariant} style={{ width: `${Math.min(100, (it.h / 2) * 100)}%` }} /></div>
              </div>
              <span className="dim t-caption" style={{ width: 48, textAlign: 'right' }}>{it.h} jam</span>
              {stateIcon}
            </div>
          );
        })}
        {p.items.length === 0 && <div className="dim t-caption">Tidak ada todo hari ini.</div>}
      </div>
      <div className="muted-box mt12" style={{ padding: '10px 12px' }}>
        <div className="row gap8" style={{ marginBottom: p.pause.length ? 8 : 0 }}>
          <Icons.Pause size={12} className="dim" />
          <span className="t-caption dim" style={{ fontWeight: 600 }}>Riwayat Pause</span>
        </div>
        {p.pause.length === 0
          ? <span className="t-caption dim">Tidak ada pause</span>
          : <table className="tbl" style={{ fontSize: 12, marginTop: 0 }}>
              <thead><tr>
                <th style={{ textAlign: 'left' }}>Tugas</th>
                <th style={{ textAlign: 'center', width: 60 }}>Mulai</th>
                <th style={{ textAlign: 'center', width: 60 }}>Selesai</th>
                <th style={{ textAlign: 'right', width: 64 }}>Durasi</th>
              </tr></thead>
              <tbody>
                {p.pause.map((r, i) => (
                  <tr key={i}>
                    <td className="t-caption" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.task}</td>
                    <td className="t-caption dim2" style={{ textAlign: 'center' }}>{r.start}</td>
                    <td className="t-caption dim2" style={{ textAlign: 'center' }}>{r.end}</td>
                    <td className="t-caption" style={{ textAlign: 'right', fontWeight: 600 }}>{r.durationMin} mnt</td>
                  </tr>
                ))}
              </tbody>
            </table>}
      </div>
    </Card>
  );
}

export default function LaporanPage() {
  const me = useAuthStore((s) => s.me);
  const isCEO = me?.role === 'CEO';
  const [period, setPeriod] = useState('Minggu ini');
  const [selectedIds, setSelectedIds] = useState([]);
  const today = getLocalDate();

  const { data: usersRaw = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet('users'),
    enabled: !!me && isCEO,
  });

  const activeMembers = usersRaw.filter((u) => (u.role === 'MEMBER' || u.role === 'Member') && u.isActive);
  const memberOptions = activeMembers.map((u) => ({ value: u.id, label: u.fullName || u.name }));

  const { data: weeklyData, isFetching: weeklyLoading } = useQuery({
    queryKey: ['reports', 'weekly', period],
    queryFn: () => apiGet(`reports/weekly?period=${PERIOD_KEY[period] || 'this_week'}`),
    enabled: !!me && isCEO,
  });

  const reportIds = isCEO
    ? activeMembers.map((u) => u.id)
    : (me ? [me.id] : []);

  const { data: detailResults = [] } = useQuery({
    queryKey: ['reports', 'daily', today, reportIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        reportIds.map((uid) => apiGet(`reports/user/${uid}?date=${today}`).then(mapReportDetail).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: !!me && reportIds.length > 0,
  });

  const columns = weeklyData?.columns || [];
  const allReportRows = weeklyData?.members || [];
  const filteredReport = selectedIds.length === 0 ? allReportRows : allReportRows.filter((r) => selectedIds.includes(r.userId));
  const filteredDetail = selectedIds.length === 0 ? detailResults : detailResults.filter((p) => selectedIds.includes(p.id));
  const dateRange = weeklyData?.dateRange;
  const subtitle = dateRange ? `dari ${fmtShortDate(dateRange.from)} – ${fmtShortDate(dateRange.to)}` : '';

  const downloadSVG = () => {
    const svg = buildRingSVG(PERIOD_TITLE[period], subtitle, columns, filteredReport);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ringkasan-${PERIOD_KEY[period] || 'laporan'}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div className="t-title">Laporan Harian</div>
          <div className="dim" style={{ marginTop: 2 }}>Ringkasan jam kerja tim</div>
        </div>
        <div className="row gap12 wrap" style={{ position: 'relative', zIndex: 10 }}>
          {isCEO && memberOptions.length > 0 && (
            <MultiSelectDropdown options={memberOptions} selected={selectedIds} onChange={setSelectedIds}
              placeholder="Semua Anggota"
              onSelectAll={() => setSelectedIds(memberOptions.map((o) => o.value))}
              onClearAll={() => setSelectedIds([])} />
          )}
          <div className="select-wrap">
            <select className="tbx" style={{ minWidth: 130 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option>Minggu ini</option><option>Minggu lalu</option><option>Bulan ini</option>
            </select>
            <Icons.Chevron size={14} />
          </div>
        </div>
      </div>

      {isCEO && (
        <Card style={{ marginBottom: 18 }}>
          <div className="row" style={{ alignItems: 'flex-start', marginBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <div className="t-subtitle">{PERIOD_TITLE[period]}</div>
              {subtitle && <div className="dim t-caption" style={{ marginTop: 2 }}>{subtitle}</div>}
            </div>
            {weeklyData && filteredReport.length > 0 && (
              <button className="btn subtle sm" onClick={downloadSVG} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Download size={14} />Download SVG
              </button>
            )}
          </div>
          <div className="hr" style={{ margin: '10px 0 6px' }} />
          {weeklyLoading
            ? <div className="dim t-caption" style={{ padding: '12px 0' }}>Memuat...</div>
            : filteredReport.length === 0
              ? <div className="dim t-caption" style={{ padding: '12px 0' }}>Tidak ada data untuk anggota yang dipilih.</div>
              : <div style={{ overflowX: 'auto' }}>
                  <table className="tbl" style={{ minWidth: 360 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 90 }}>Anggota</th>
                        {columns.map((c) => <th key={c} style={{ textAlign: 'center' }}>{c}</th>)}
                        <th style={{ textAlign: 'right', width: 80 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReport.map((r) => {
                        const first = (r.fullName || '').split(' ')[0];
                        const total = Math.round(r.days.reduce((a, b) => a + b, 0) * 10) / 10;
                        return (
                          <tr key={r.userId}>
                            <td><div className="row gap8"><Avatar first={first} size={24} /><span className="t-body-strong">{first}</span></div></td>
                            {r.days.map((h, i) => (
                              <td key={i} style={{ textAlign: 'center' }}>
                                <span style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 7,
                                  fontWeight: 600, fontSize: 13,
                                  color: h >= 8 ? 'var(--accent)' : h > 0 ? 'var(--text)' : 'var(--text-secondary)',
                                  background: h >= 8 ? 'color-mix(in srgb,var(--accent) 13%,transparent)' : 'var(--subtle-sel)' }}>
                                  {h > 0 ? h : '–'}
                                </span>
                              </td>
                            ))}
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{total} j</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid var(--divider)' }}>
                        <td style={{ fontWeight: 700 }}>Total</td>
                        {columns.map((_, i) => {
                          const colSum = Math.round(filteredReport.reduce((a, r) => a + (r.days[i] || 0), 0) * 10) / 10;
                          return <td key={i} style={{ textAlign: 'center', fontWeight: 700 }}>{colSum > 0 ? colSum : '–'}</td>;
                        })}
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {Math.round(filteredReport.reduce((a, r) => a + r.days.reduce((x, y) => x + y, 0), 0) * 10) / 10} j
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>}
        </Card>
      )}

      <SectionLabel><Icons.Calendar size={13} /> Detail Hari Ini</SectionLabel>
      {filteredDetail.length === 0
        ? <Card><div className="dim t-caption">Memuat laporan...</div></Card>
        : <div className="col" style={{ gap: 14 }}>
            {filteredDetail.map((p) => <ReportDetailCard key={p.id || p.first} p={p} />)}
          </div>}
    </div>
  );
}
