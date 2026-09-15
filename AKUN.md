# Akun & Autentikasi — ISG Mini SIAKAD

Dokumen ini merangkum semua hal soal akun: siapa saja perannya, apa yang bisa
mereka lakukan, bagaimana cara masuk, dan cara membuat akun baru.

---

## 1. Akun untuk pengembangan

Akun-akun ini **tidak otomatis ada**. Admin dan peserta contoh dibuat oleh
`npx prisma db seed`; akun mentor, co-mentor, dan supervisor dibuat lewat
halaman **Manajemen Akun** (`/dashboard/akun`) atau langsung di database.

| Peran | Masuk dengan | Kata sandi |
|---|---|---|
| Admin | `admin@isg.dev` | `Admin123!` |
| Mentor | `mentor@isg.dev` | `Mentor123!` |
| Co-Mentor | `comentor@isg.dev` | `CoMentor123!` |
| Supervisor (Advisor) | `supervisor@isg.dev` | `Supervisor123!` |
| Peserta contoh | NIM dari `.env` | dari `.env` |

Peserta contoh hanya dibuat kalau `SEED_PARTICIPANT_NIM` dan
`SEED_PARTICIPANT_PASSWORD` diisi di `.env`.

| Variabel `.env` | Wajib | Default kalau kosong |
|---|---|---|
| `SEED_PARTICIPANT_NIM` | ✅ | — (tanpa ini peserta tidak dibuat) |
| `SEED_PARTICIPANT_PASSWORD` | ✅ | — (tanpa ini peserta tidak dibuat) |
| `SEED_PARTICIPANT_NAME` | | `Peserta ISG` |
| `SEED_PARTICIPANT_EMAIL` | | `<NIM>@isg.dev` |
| `SEED_PARTICIPANT_STUDY_PROGRAM` | | `Informatika` |
| `SEED_PARTICIPANT_SEMESTER` | | `3` |

---

## 2. Cara masuk

Halaman `/login` hanya punya satu kolom identitas: **"Email atau NIM"**. Sistem
menentukan sendiri caranya berdasarkan isinya:

| Yang kamu ketik | Dicari berdasarkan |
|---|---|
| Mengandung `@` | Email di tabel `users` |
| Tidak mengandung `@` | NIM (`studentId`) di tabel `participant_profiles` |

Aturan praktisnya: **peserta** masuk dengan **NIM**, **staf** masuk dengan
**email**. Hanya akun berstatus `VERIFIED` yang bisa masuk.

---

## 3. Peran dan haknya

| Peran | Bisa apa |
|---|---|
| `ADMIN` | Semuanya: verifikasi pendaftar, manajemen akun, angkatan, jadwal, presensi, tugas, kuis, dan pemantauan |
| `MENTOR` / `CO_MENTOR` | Kelola jadwal, buka sesi presensi QR, buat & nilai tugas, buat kuis & lihat hasilnya |
| `ADVISOR` (Supervisor) | **Hanya memantau.** Melihat seluruh angkatan, mentor, co-mentor, peserta, progres, nilai tugas dan kuis — tanpa satu pun tombol ubah |
| `PARTICIPANT` | Lihat jadwal, presensi QR, kumpulkan tugas, kerjakan kuis, lihat nilai, kelola profil |

### Halaman per peran

| Halaman | Admin | Mentor / Co-Mentor | Advisor | Peserta |
|---|:--:|:--:|:--:|:--:|
| `/dashboard` | ✅ pantau | ✅ | ✅ pantau | ✅ progres pribadi |
| `/dashboard/pantau` | ✅ | 👁️ angkatan binaan | ✅ | — |
| `/dashboard/pendaftar` | ✅ | — | — | — |
| `/dashboard/akun` | ✅ | — | — | — |
| `/dashboard/angkatan` | ✅ | — | — | — |
| `/dashboard/jadwal` | ✅ kelola | ✅ kelola | 👁️ lihat | 👁️ lihat |
| `/dashboard/jadwal/[id]/presensi` | ✅ | ✅ | — | — |
| `/dashboard/presensi` | — | — | — | ✅ pindai QR |
| `/dashboard/tugas` | ✅ kelola | ✅ kelola | 👁️ lihat | ✅ kumpulkan |
| `/dashboard/tugas/[id]` | ✅ nilai | ✅ nilai | — | — |
| `/dashboard/kuis` | ✅ kelola | ✅ kelola | 👁️ lihat | ✅ kerjakan |
| `/dashboard/kuis/[id]` | ✅ soal & hasil | ✅ soal & hasil | — | — |
| `/dashboard/nilai` | — | — | — | ✅ |
| `/dashboard/profil` | ✅ | ✅ | ✅ | ✅ |

Pembatasannya berlapis dua: [`src/proxy.ts`](src/proxy.ts) menjaga seluruh
`/dashboard/*`, dan [`requireRole()`](src/lib/auth-guards.ts) dipanggil di tiap
halaman. Server action juga memeriksa peran sendiri, jadi menyembunyikan tombol
di UI bukan satu-satunya penjaga.

---

## 4. Status akun

| Status | Arti | Bisa masuk? |
|---|---|---|
| `PENDING` | Baru mendaftar, menunggu ditinjau Admin | ❌ |
| `VERIFIED` | Sudah disetujui Admin | ✅ |
| `REJECTED` | Pendaftaran ditolak | ❌ |
| `REVISION_REQUIRED` | Admin minta data diperbaiki | ❌ |
| `DISABLED` | Akun dinonaktifkan | ❌ |

Pendaftar memantau statusnya di `/register/status/<nomor-pendaftaran>` tanpa
perlu login.

---

## 5. Membuat akun baru

### Peserta — daftar sendiri di `/register`

Dua langkah. Setelah submit, akun berstatus `PENDING` dan Admin
memverifikasinya di `/dashboard/pendaftar`.

| Field | Aturan |
|---|---|
| Nama | Minimal 3 huruf |
| NIM | Hanya angka, 6–15 digit, belum pernah dipakai |
| Email | Email pribadi apa pun yang aktif, belum pernah dipakai |
| Telepon | 9–16 digit |
| Semester | 1–14 |
| Alasan bergabung | **Wajib**, minimal 20 karakter |
| Minat teknologi | Opsional, teks bebas dipisah koma |
| Foto profil | Opsional, dikecilkan jadi 256×256 JPEG |
| Kata sandi | Minimal 8 karakter |

### Kenapa bukan email kampus

`REQUIRE_CAMPUS_EMAIL` di
[`src/features/registration/constants.ts`](src/features/registration/constants.ts)
sengaja `false`. Alasannya bukan teknis pengiriman — kirim ke
`@unikadelasalle.ac.id` sebenarnya diterima server (`250 2.0.0 OK`, nol
penolakan) — tapi karena **karantina admin Google Workspace** kampus menahan
email dari pengirim luar sebelum sampai kotak masuk. Gejalanya: email tidak
muncul sama sekali, di folder Spam pun tidak ada. Hanya admin IT kampus yang
bisa melepaskannya, jadi peserta bisa tidak pernah menerima pemberitahuan
aktivasi maupun tautan reset kata sandi.

Identitas mahasiswa tetap terjaga tanpa syarat ini: **NIM wajib, unik, dan
setiap pendaftar diverifikasi manual** oleh Admin. Ubah konstanta itu ke `true`
untuk mewajibkan domain kampus kembali — validasi klien dan server keduanya
ikut berubah dari satu tempat itu.

Setelah pendaftar diverifikasi dan ditempatkan ke angkatan oleh Admin di
`/dashboard/pendaftar`, sistem otomatis mengirim email penerimaan ke email
pendaftar berisi NIM, email, dan angkatannya.

**Email tidak pernah memuat kata sandi.** Peserta memakai kata sandi yang dia
buat sendiri saat mendaftar. Mengirim kredensial bersama tautan masuk adalah
pola yang dikenali Gmail sebagai phishing dan membuat email mendarat di Spam,
selain meninggalkan kata sandi di kotak surat penerima selamanya.

### Staf — lewat Manajemen Akun

Admin membuka `/dashboard/akun` → **Tambah Akun Staf**. Bisa memilih peran
Admin, Mentor, Co-Mentor, atau Advisor. Akun staf langsung `VERIFIED`.

Dari halaman yang sama Admin juga bisa mengubah peran, menyetel ulang kata
sandi siapa pun, serta menonaktifkan dan mengaktifkan akun.

**Dua pengaman yang berlaku di sana:** Admin tidak bisa menonaktifkan atau
menurunkan peran akunnya sendiri, dan data pribadi akun peserta tidak bisa
diubah dari situ karena terikat pendaftaran dan angkatan.

---

## 6. Lupa kata sandi

Pemulihan berjalan otomatis lewat email, tanpa perlu menunggu Admin.

1. Pengguna membuka `/forgot-password` dan memasukkan **email atau NIM**.
2. Sistem mengirim tautan sekali pakai ke email terdaftar.
3. Tautan membuka `/reset-password?token=...` untuk memilih kata sandi baru.

| Aturan | Nilai |
|---|---|
| Masa berlaku tautan | 60 menit |
| Jumlah pemakaian | sekali; tautan langsung hangus setelah dipakai |
| Tautan lama | otomatis hangus saat tautan baru diminta |
| Penyimpanan token | hanya hash SHA-256 di basis data, token mentah cuma ada di email |

Dua hal yang disengaja:

**Jawabannya selalu sama** — baik akunnya ada maupun tidak, halaman selalu
menampilkan "Tautan sudah dikirim". Ini mencegah orang luar menebak alamat
email atau NIM mana yang terdaftar.

**Akun yang belum `VERIFIED` tidak dikirimi tautan.** Pendaftar yang masih
`PENDING`, ditolak, atau dinonaktifkan tidak bisa memulihkan kata sandi;
mereka memang belum punya akses. Admin tetap bisa menyetel ulang kata sandi
siapa pun dari `/dashboard/akun`.

Setelah kata sandi berganti, satu email pemberitahuan dikirim, supaya pemilik
akun tahu kalau ternyata bukan dia yang melakukannya.

Pengguna yang **masih bisa masuk** dapat mengganti kata sandinya sendiri di
`/dashboard/profil`, dan di sana kata sandi lama wajib dicocokkan dulu.

### Pengiriman email: jangan pakai SMTP di Railway

`EMAIL_PROVIDER` **harus** `resend` di produksi.

Railway menutup koneksi SMTP keluar, jadi pengiriman lewat `smtp.gmail.com`
menggantung sampai `Connection timeout`. Kredensial Gmail yang benar sekalipun
tidak menolong, dan gejalanya menyesatkan: antarmuka tetap melaporkan berhasil
sementara log server berisi
`[EMAIL] pengiriman lewat smtp gagal: Connection timeout`. Hanya penyedia
berbasis HTTPS yang bisa keluar dari Railway.

`EMAIL_PROVIDER=smtp` tetap berguna untuk pengembangan di komputer sendiri,
karena di sana port SMTP terbuka.

Variabel yang dipakai di produksi:

| Variabel | Nilai |
|---|---|
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | kunci dari dasbor Resend |
| `RESEND_FROM_EMAIL` | `Informatics Study Group <noreply@informaticstudygroup.web.id>` |
| `EMAIL_REPLY_TO` | `informaticsstudygroup@gmail.com` |

Alamat pengirim wajib memuat `@`. Kalau isinya hanya nama, Resend menolaknya
dengan `HTTP 422 Invalid \`from\` field`; kode sekarang memasangkannya otomatis
dengan alamat yang diketahui, tapi lebih baik diisi lengkap sejak awal.

Perlu diketahui saat memeriksa: perintah `railway variables` **menyembunyikan
bagian `<alamat>`** saat menampilkan nilainya, sehingga terlihat seolah hanya
berisi nama. Untuk melihat nilai sebenarnya, pakai
`railway run -- node -e "console.log(process.env.RESEND_FROM_EMAIL)"`.

## 7. Catatan keamanan

**Kata sandi Admin ditulis langsung di `prisma/seed.ts`, dan file itu ter-commit
di git.** Untuk tahap pengembangan tidak masalah, tapi **jangan dibawa ke
produksi**. Di file yang sama, `seedParticipant()` sudah benar membaca dari
`.env` — hanya bagian admin yang masih hardcoded.

Kata sandi mentor, co-mentor, dan supervisor di bagian 1 juga kata sandi
pengembangan. Ganti sebelum dipakai sungguhan.

Satu hal lain yang perlu diketahui: **validasi kekuatan kata sandi hanya di sisi
klien.** Server cuma menuntut minimal 8 karakter, sedangkan form pendaftaran
menuntut tiga dari empat syarat. Permintaan yang dikirim langsung ke server bisa
memakai kata sandi lemah.

Dan: **status akun tidak dicek ulang setelah login.** Statusnya hanya diperiksa
saat masuk lalu disimpan di token, sehingga akun yang dinonaktifkan tetap punya
sesi hidup sampai tokennya kedaluwarsa.

---

## 8. Menyiapkan dari nol

```bash
# 1. Isi .env — lihat .env.example. DATABASE_URL, DIRECT_URL, AUTH_SECRET wajib.
#    AUTH_SECRET dibuat dengan: npx auth secret

# 2. Terapkan skema
npx prisma migrate deploy

# 3. Buat akun bawaan
npx prisma db seed

# 4. Jalankan
npm run dev
```

Seed memakai `upsert`, jadi aman dijalankan berulang kali.

**Catatan `DATABASE_URL`:** `.env.example` menganjurkan port `6543` dengan
`?pgbouncer=true` untuk runtime aplikasi, dan port `5432` untuk `DIRECT_URL`
yang dipakai saat migrasi. Jangan tertukar.

### Menguji tanpa Supabase

`src/lib/prisma.ts` menyalakan SSL hanya untuk host non-lokal, jadi Postgres di
Docker bisa dipakai langsung untuk pengembangan:

```bash
docker run -d --name isg-pg -e POSTGRES_PASSWORD=isgdev \
  -e POSTGRES_USER=isg -e POSTGRES_DB=isg -p 55432:5432 postgres:16-alpine

export DATABASE_URL="postgresql://isg:isgdev@localhost:55432/isg"
export DIRECT_URL="postgresql://isg:isgdev@localhost:55432/isg"
npx prisma migrate deploy && npx prisma db seed && npm run dev
```

Menjalankannya lewat variabel di terminal seperti di atas membuat `.env` tetap
menunjuk Supabase — tidak ada yang perlu diubah saat kembali online.
