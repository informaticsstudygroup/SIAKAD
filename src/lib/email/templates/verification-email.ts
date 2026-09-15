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
  const subject = "Akun SIAKAD ISG Anda telah aktif";
  const passwordDisplay = data.passwordText
    ? data.passwordText
    : "Sesuai kata sandi yang Anda buat saat pendaftaran";

  const text = `Halo ${data.name},

Pendaftaran Anda di Informatics Study Group telah diverifikasi dan disetujui untuk ${data.batchName}. Akun SIAKAD ISG Anda saat ini sudah aktif.

Kredensial Akun:
NIM / Identitas Login : ${data.studentId}
Email Terdaftar       : ${data.email}
Kata Sandi            : ${passwordDisplay}
Angkatan Belajar      : ${data.batchName}

${data.note ? `Catatan Admin:
${data.note}

` : ""}Silakan masuk melalui portal SIAKAD ISG:
${data.loginUrl}

Gunakan NIM atau email di atas beserta kata sandi Anda untuk masuk ke sistem.

Informatics Study Group
Universitas Katolik De La Salle Manado

Pesan otomatis dari portal SIAKAD ISG.`;

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
