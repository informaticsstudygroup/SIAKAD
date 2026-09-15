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

Tiga langkah. Setelah submit, akun berstatus `PENDING` dan Admin
memverifikasinya di `/dashboard/pendaftar`.

| Field | Aturan |
|---|---|
| Nama | Minimal 3 huruf |
| NIM | Hanya angka, 6–15 digit, belum pernah dipakai |
| Email | **Wajib email kampus** `@unikadelasalle.ac.id`, belum pernah dipakai |
| Telepon | 9–16 digit |
| Semester | 1–14 |
| Alasan bergabung | **Wajib**, minimal 20 karakter |
| Minat teknologi | Opsional, teks bebas dipisah koma |
| Foto profil | Opsional, dikecilkan jadi 256×256 JPEG |
| Kata sandi | Minimal 8 karakter |

Domain email kampus diatur di
[`src/features/registration/constants.ts`](src/features/registration/constants.ts).

Setelah pendaftar diverifikasi dan ditempatkan ke angkatan oleh Admin di
`/dashboard/pendaftar`, sistem otomatis mengirimkan **email konfirmasi penerimaan
dan rincian akun** ke email kampus pendaftar, berisi NIM (identitas login utama),
email, kata sandi, dan angkatan yang ditentukan.

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

Belum ada pemulihan otomatis karena proyek ini belum punya layanan pengiriman
email. `/forgot-password` mengarahkan pengguna menghubungi Admin, lalu Admin
menyetel ulang lewat `/dashboard/akun`.
Sistem telah memiliki layanan pengiriman email (`src/lib/email/transporter.ts`)
yang aktif via konfigurasi SMTP di `.env`. `/forgot-password` saat ini
mengarahkan pengguna menghubungi Admin, lalu Admin menyetel ulang lewat
`/dashboard/akun`.

Pengguna yang **masih bisa masuk** dapat mengganti kata sandinya sendiri di
`/dashboard/profil` — dan di sana kata sandi lama wajib dicocokkan dulu.

---

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
