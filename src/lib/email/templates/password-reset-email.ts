/**
 * Email pemulihan kata sandi.
 *
 * Sama seperti email verifikasi, tidak ada kata sandi di dalam email ini —
 * hanya tautan sekali pakai. Mengirim kredensial lewat email memicu filter
 * phishing sekaligus meninggalkan kata sandi di kotak surat penerima.
 */
export function buildPasswordResetEmail(data: {
  name: string;
  resetUrl: string;
  minutes: number;
}) {
  const subject = "Permintaan penggantian kata sandi ISG";

  const text = `Halo ${data.name},

Kami menerima permintaan untuk mengganti kata sandi akun ISG kamu.

Buka tautan berikut untuk memilih kata sandi baru:
${data.resetUrl}

Tautan ini berlaku ${data.minutes} menit dan hanya bisa dipakai sekali.

Kalau bukan kamu yang meminta, abaikan saja email ini. Kata sandimu tetap seperti semula dan tidak ada yang berubah.

Informatics Study Group
Universitas Katolik De La Salle Manado`;

  return { subject, text };
}

/** Pemberitahuan setelah kata sandi benar-benar berganti. */
export function buildPasswordChangedEmail(data: {
  name: string;
  loginUrl: string;
}) {
  const subject = "Kata sandi ISG kamu sudah diganti";

  const text = `Halo ${data.name},

Kata sandi akun ISG kamu baru saja diganti melalui tautan pemulihan.

Kamu sudah bisa masuk memakai kata sandi baru di:
${data.loginUrl}

Kalau bukan kamu yang melakukannya, segera balas email ini agar Admin bisa mengamankan akunmu.

Informatics Study Group
Universitas Katolik De La Salle Manado`;

  return { subject, text };
}
