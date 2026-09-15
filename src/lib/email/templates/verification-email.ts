export type VerificationEmailData = {
  name: string;
  studentId: string;
  email: string;
  batchName: string;
  passwordText?: string;
  loginUrl: string;
  note?: string | null;
};

export type RevisionEmailData = {
  name: string;
  note: string;
  statusUrl: string;
};

export type RejectionEmailData = {
  name: string;
  note: string;
};

/**
 * Template email plain text untuk peserta yang pendaftarannya disetujui.
 */
export function buildVerificationSuccessEmail(data: VerificationEmailData) {
  const subject = `Selamat, pendaftaran ISG kamu diterima — ${data.batchName}`;

  // Tidak ada kata sandi di dalam email ini. Mengirim kredensial berikut
  // tautan masuk adalah pola yang dikenali Gmail sebagai phishing, dan itu
  // yang membuat email sebelumnya mendarat di Spam.
  const text = `Halo ${data.name},

Kabar baik. Pendaftaranmu di Informatics Study Group sudah ditinjau dan diterima, dan kamu ditempatkan di ${data.batchName}.

Rincian keanggotaanmu:
NIM       : ${data.studentId}
Email     : ${data.email}
Angkatan  : ${data.batchName}
${data.note ? `
Catatan dari Admin:
${data.note}
` : ""}
Kamu sudah bisa masuk ke portal ISG di ${data.loginUrl} memakai NIM dan kata sandi yang kamu buat sendiri saat mendaftar. Kami tidak pernah mengirimkan kata sandi lewat email.

Kalau lupa kata sandi, balas email ini dan Admin akan membantu.

Sampai jumpa di kelas,
Informatics Study Group
Universitas Katolik De La Salle Manado`;

  return { subject, text };
}

/**
 * Template email plain text untuk permintaan perbaikan data pendaftaran.
 */
export function buildApplicantRevisionEmail(data: RevisionEmailData) {
  const subject = "Pemberitahuan perbaikan berkas pendaftaran ISG";
  const text = `Halo ${data.name},

Berkas pendaftaran ISG Anda memerlukan perbaikan sebelum dapat diverifikasi.

Catatan Admin:
${data.note}

Silakan cek status pendaftaran Anda di:
${data.statusUrl}

Informatics Study Group
Universitas Katolik De La Salle Manado

Pesan otomatis dari portal SIAKAD ISG.`;

  return { subject, text };
}

/**
 * Template email plain text untuk pendaftaran yang belum dapat diterima.
 */
export function buildApplicantRejectionEmail(data: RejectionEmailData) {
  const subject = "Pemberitahuan status pendaftaran Informatics Study Group";
  const text = `Halo ${data.name},

Terima kasih atas minat Anda mendaftar di Informatics Study Group (ISG).
Setelah proses peninjauan berkas, pendaftaran Anda belum dapat kami terima untuk periode ini.

Keterangan:
${data.note}

Informatics Study Group
Universitas Katolik De La Salle Manado

Pesan otomatis dari portal SIAKAD ISG.`;

  return { subject, text };
}
