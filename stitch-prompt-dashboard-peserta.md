# Stitch Prompt — ISG Mini SIAKAD: Dashboard Peserta

Design a modern, professional analytics-style dashboard for "ISG Mini SIAKAD"
— Dashboard Peserta (Participant Dashboard). Reference the layout DNA of a
premium SaaS analytics dashboard (hero stat card + pastel stat cards, chart
cards with tooltip callouts, pill toggles, donut+list combo) — but with a
restrained, non-rainbow color palette.

## Brand Identity (must follow exactly)

- Primary Blue: #0C81E4
- Secondary Cyan: #11C4D4
- Accent Mint: #4FE7AF
- Dark Navy: #071A3D
- Main Text: #102033
- Secondary Text: #64748B
- Background: #F7FAFC
- Surface: #FFFFFF
- Border: #E2E8F0
- Success: #16A36A
- Warning: #F59E0B
- Danger: #E5484D
- Font: Plus Jakarta Sans
- Card corner radius: 14-18px
- Color balance: 70% neutral/white, 20% blue/navy, 10% cyan/mint accents.
  DO NOT use pink, purple, orange, or rainbow chart colors — every accent
  color must come from the palette above only.
- Logo motif: overlapping rounded blue circle/pill shapes with a diagonal
  cyan-to-mint semi-transparent strip crossing through them (see attached
  ISG logo). Echo this motif subtly as a decorative blob + diagonal accent
  in the corner of the welcome/hero card — do not overdo it.

## Layout Structure (1440px desktop, collapses to 390px mobile)

**Top navbar:**
- ISG logo top-left
- Center: pill-style horizontal nav — Dashboard (active, dark navy pill),
  Jadwal, Presensi, Tugas, Kuis, Nilai, Sertifikat
- Right: notification bell icon, avatar + participant name + "Peserta"
  label + dropdown chevron

**Page header:**
- Large heading: "Selamat datang, Daniel."
- Subtext: "Lihat perkembangan belajar dan aktivitas ISG kamu hari ini."
- Top-right: current date / "Hari ini" indicator

**Row of 5 stat cards (one hero + four pastel):**
1. HERO card, solid dark navy (#071A3D) background, white text:
   "Persentase Kehadiran" — big number (e.g. 92%) + small trend badge
2. Pastel blue-tint card: "Tugas Selesai" — e.g. 8/10 + status badge
3. Pastel mint-tint card: "Rata-rata Nilai" — e.g. 87 + trend badge
4. Pastel cyan-tint card: "Sertifikat Diperoleh" — e.g. 2 + badge
5. Pastel neutral card: "Kuis Aktif" — e.g. 1 + "Segera berakhir" badge

**Two large side-by-side chart cards:**
- LEFT: "Kehadiran per Bulan" — stacked bar chart (segments: Hadir in
  blue, Izin in cyan, Tidak Hadir in light gray/red-tint), pill toggle
  top-right (Minggu / Bulan / Tahun, active = dark navy pill), hover
  tooltip callout card showing exact breakdown numbers for a selected bar
- RIGHT: "Progress Nilai" — line/area chart trending across recent
  assignments/quizzes, pill toggle (Minggu/Bulan/Tahun), filter pills
  below chart (Semua / Tugas / Kuis / Proyek, active = dark navy pill),
  tooltip callout showing date + score on hover point

**Bottom row of 3 cards:**
1. "Progress Kelayakan Sertifikat" — donut/ring chart centered showing
   overall eligibility %, with legend list beside/below: Kehadiran (%),
   Nilai Tugas (%), Nilai Kuis (%), each with a colored dot + percentage
2. "Jadwal Terdekat" — ranked list of upcoming meetings, each row: date,
   meeting title, category tag, small icon
3. "Pengumuman ISG" / "Aktivitas Terakhir" — list with colored status
   chips per item (e.g. green "Sudah Dinilai", amber "Menunggu", blue
   "Aktif") similar to the traffic-light chip style at the bottom of a
   reference delivery-time card, but recolored to ISG palette

## Status chips to use throughout

Hadir (green), Izin (amber), Tidak Hadir (red), Belum Dinilai (gray),
Sudah Dinilai (blue), Terlambat (amber), Aktif (cyan), Selesai (mint).
Always pair color with a text label — never color alone.

## Style constraints

- Soft rounded corners (14-18px), thin 1px borders (#E2E8F0), soft subtle
  shadows — no heavy drop shadows, no glassmorphism, no neon, no AI-glow
  gradients.
- Generous white space, clean grid alignment, Plus Jakarta Sans throughout.
- Every chart must also show its number in a readable label/legend, not
  rely on color alone.
- Mobile (390px): stat cards stack 2-per-row then 1-per-row, charts stack
  vertically, bottom nav bar for key pages (Dashboard/Jadwal/Presensi/
  Tugas/Profil), top nav collapses into hamburger drawer.

## Deliverables

- Desktop frame (1440px) and mobile frame (390px) of this Dashboard
  Peserta screen only.
