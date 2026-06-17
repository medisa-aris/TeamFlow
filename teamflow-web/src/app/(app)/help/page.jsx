'use client';
import { useState } from 'react';
import { Icons } from '@/components/ui/icons';
import { Card, SectionLabel } from '@/components/ui/primitives';

const FAQ_ITEMS = [
  { q: 'Apa itu status "Menunggu Approval"?', a: 'Todo yang kamu ajukan sedang menunggu persetujuan CEO. Todo belum bisa dimulai sampai disetujui. Jika CEO tidak merespons sebelum batas waktu yang dikonfigurasi, todo akan otomatis disetujui (auto-approve).' },
  { q: 'Apa yang terjadi jika todo ditolak CEO?', a: 'Todo yang ditolak muncul di halaman "Menunggu Approval" dengan alasan penolakan. Kamu bisa klik "Edit & Resubmit" untuk memperbaiki dan mengajukan ulang, atau klik "Hapus" untuk menghapus todo tersebut.' },
  { q: 'Bisakah saya mengubah todo yang sudah diajukan?', a: 'Hanya todo yang berstatus Ditolak yang bisa diubah, dengan fitur "Edit & Resubmit". Todo yang sedang menunggu atau sudah disetujui tidak bisa diedit secara langsung.' },
  { q: 'Apa itu Overtime?', a: 'Jika total estimasi jam todo kamu dalam satu hari melebihi 8 jam, todo tersebut akan masuk kategori Overtime. Todo overtime memerlukan approval khusus dari CEO dan ditandai dengan label oranye.' },
  { q: 'Apa itu Auto-approve?', a: 'Jika CEO belum merespons todo kamu sebelum batas waktu yang telah dikonfigurasi (default pukul 09:00 WIB), sistem akan otomatis menyetujui todo tersebut. Ini memastikan pekerjaanmu tidak tertunda.' },
  { q: 'Bagaimana cara mengarsipkan todo yang selesai?', a: 'Setelah todo berstatus Selesai (DONE), kamu bisa klik tombol "Arsipkan" di samping todo tersebut di halaman My Todo. Todo yang diarsipkan akan tersimpan di halaman "Selesai" dan tidak muncul lagi di My Todo.' },
  { q: 'Apa itu "Teruskan ke Besok"?', a: 'Tombol ini memindahkan todo yang sudah disetujui tapi belum dikerjakan ke hari kerja berikutnya. Berguna jika kamu tidak sempat mengerjakan todo hari ini dan ingin melanjutkannya besok.' },
  { q: 'Kenapa saya tidak bisa mengajukan todo di akhir pekan?', a: 'TeamFlow hanya mendukung hari kerja (Senin–Jumat). Pengajuan todo di Sabtu atau Minggu akan ditolak otomatis oleh sistem untuk memastikan manajemen waktu kerja yang sehat.' },
  { q: 'Berapa batas maksimum jam kerja per hari?', a: 'Batas normal adalah 8 jam per hari. Kamu bisa mengajukan lebih dari itu, namun todo akan dikategorikan sebagai Overtime dan memerlukan persetujuan khusus dari CEO.' },
  { q: 'Apakah saya bisa melihat todo hari-hari sebelumnya?', a: 'Ya! Di halaman My Todo terdapat filter tanggal di pojok kanan atas. Pilih tanggal lain untuk melihat todo di hari tersebut. Default-nya adalah hari ini.' },
];

const STEPS = [
  { n: 1, title: 'Buka halaman My Todo', desc: 'Klik menu My Todo di navigasi kiri.' },
  { n: 2, title: 'Klik tombol "Tambah Todo"', desc: 'Tombol biru di pojok kanan atas halaman My Todo.' },
  { n: 3, title: 'Isi Judul Todo', desc: 'Masukkan judul singkat yang menggambarkan pekerjaan, misalnya: "Desain halaman login".' },
  { n: 4, title: 'Tulis Deskripsi (min. 10 kata)', desc: 'Jelaskan secara detail apa yang akan dikerjakan, langkah-langkahnya, tools yang digunakan, dan hasil yang diharapkan. Deskripsi minimal 10 kata agar CEO bisa menilai kelayakannya.' },
  { n: 5, title: 'Pilih Estimasi Waktu', desc: 'Pilih durasi pengerjaan: 0.5 / 1 / 1.5 / 2 jam. Pastikan total jam hari ini tidak melebihi 8 jam (kecuali izin overtime).' },
  { n: 6, title: 'Klik "Ajukan"', desc: 'Todo dikirim ke CEO untuk disetujui. Kamu bisa mulai mengerjakan setelah disetujui.' },
];

const RULES = [
  { icon: Icons.Clock, color: '#c8650a', title: 'Batas 8 Jam/Hari', desc: 'Total estimasi todo dalam satu hari maksimal 8 jam. Lebih dari itu = Overtime, butuh approval khusus.' },
  { icon: Icons.Flag, color: 'var(--accent)', title: 'Deskripsi Minimal 10 Kata', desc: 'Setiap todo wajib memiliki deskripsi yang jelas agar CEO dapat menilai keperluan dan urgensinya.' },
  { icon: Icons.Hourglass, color: '#2b9d6b', title: 'Auto-approve Sesuai Batas', desc: 'Jika CEO tidak merespons sebelum batas waktu (dikonfigurasi di Settings CEO), todo otomatis disetujui.' },
  { icon: Icons.Calendar, color: '#5e3d89', title: 'Hanya Hari Kerja (Sen–Jum)', desc: 'Pengajuan todo hanya bisa dilakukan di hari kerja. Akhir pekan ditolak otomatis oleh sistem.' },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="content-pad page-enter" style={{ maxWidth: 780 }}>
      <div className="t-title" style={{ marginBottom: 4 }}>Bantuan &amp; Panduan</div>
      <div className="dim" style={{ marginBottom: 24 }}>Panduan penggunaan TeamFlow untuk anggota tim</div>

      <SectionLabel><Icons.Tasks size={13} /> Cara Menambahkan Todo</SectionLabel>
      <Card>
        <div className="col" style={{ gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} className="row gap14" style={{ padding: '14px 0', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
              <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                color: 'var(--accent)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>{s.n}</div>
              <div>
                <div className="t-body-strong">{s.title}</div>
                <div className="dim t-caption" style={{ marginTop: 3 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <SectionLabel><Icons.Info size={13} /> Aturan &amp; Ketentuan</SectionLabel>
      <div className="stat-grid" style={{ marginBottom: 0 }}>
        {RULES.map((r, i) => (
          <Card key={i} hover>
            <div className="row gap12" style={{ marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center',
                color: r.color, background: `color-mix(in srgb, ${r.color} 14%, transparent)`, flexShrink: 0 }}>
                <r.icon size={18} />
              </div>
              <span className="t-body-strong" style={{ alignSelf: 'center' }}>{r.title}</span>
            </div>
            <p className="dim t-caption" style={{ margin: 0, lineHeight: 1.5 }}>{r.desc}</p>
          </Card>
        ))}
      </div>

      <SectionLabel><Icons.Bolt size={13} /> Tanya Jawab (FAQ)</SectionLabel>
      <div className="col" style={{ gap: 6 }}>
        {FAQ_ITEMS.map((item, i) => (
          <Card key={i} pad={false} style={{ overflow: 'hidden' }}>
            <div className="row gap12 reveal" style={{ padding: '14px 18px', cursor: 'pointer' }}
                 onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <Icons.ChevronRight size={15} className="dim2" style={{
                transform: openFaq === i ? 'rotate(90deg)' : 'none',
                transition: 'transform .18s', flexShrink: 0,
              }} />
              <span className="t-body-strong" style={{ flex: 1 }}>{item.q}</span>
            </div>
            {openFaq === i && (
              <div style={{ padding: '0 18px 16px 45px', borderTop: '1px solid var(--divider)' }}>
                <p className="dim t-caption" style={{ margin: '12px 0 0', lineHeight: 1.6 }}>{item.a}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="muted-box mt16 row gap8" style={{ alignItems: 'flex-start' }}>
        <Icons.Info size={14} className="accent-text" style={{ marginTop: 1, flexShrink: 0 }} />
        <span className="t-caption dim">Jika masih ada pertanyaan atau menemukan masalah, hubungi CEO atau admin tim kamu.</span>
      </div>
    </div>
  );
}
