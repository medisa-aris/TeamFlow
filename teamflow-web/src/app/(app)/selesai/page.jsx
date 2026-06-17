'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/apiClient';
import { mapTodo } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card } from '@/components/ui/primitives';

export default function SelesaiPage() {
  const me = useAuthStore((s) => s.me);

  const { data: raw = [] } = useQuery({
    queryKey: ['todos', 'archived'],
    queryFn: () => apiGet('todos/archived'),
    enabled: !!me,
  });

  const archived = raw.map(mapTodo);

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div className="t-title">Selesai</div>
          <div className="dim" style={{ marginTop: 2 }}>Todo yang sudah diarsipkan</div>
        </div>
      </div>

      {archived.length === 0 && (
        <Card><div className="dim t-caption">Belum ada todo yang diarsipkan. Selesaikan todo lalu klik "Arsipkan".</div></Card>
      )}

      {archived.length > 0 && (
        <Card pad={false}>
          {archived.map((t, i) => (
            <div key={t.id} className="row gap12" style={{ padding: '13px 18px', borderTop: i ? '1px solid var(--divider)' : 'none', alignItems: 'center' }}>
              <Icons.Archive size={16} style={{ color: '#0f7b3f', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="t-body-strong">{t.title}</div>
                {t.desc && <div className="dim t-caption" style={{ marginTop: 2 }}>{t.desc}</div>}
              </div>
              <span className="dim t-caption">{t.est} jam</span>
              <span className="dim2 t-caption" style={{ width: 110, textAlign: 'right' }}>{t.range || t.createdAt || ''}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
