import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  /** Alamat balasan. Menaikkan legitimasi email di mata penyedia surat. */
  replyTo?: string;
};

export type SendEmailResult = {
  success: boolean;
  provider?: "resend" | "smtp" | "mock";
  error?: string;
};

/**
 * Dua penyedia didukung sekaligus, dipilih otomatis berdasarkan variabel
 * lingkungan yang terisi:
 *
 *   RESEND_API_KEY + RESEND_FROM_EMAIL  -> Resend (dipakai lebih dulu)
 *   SMTP_HOST + SMTP_USER + SMTP_PASS   -> SMTP biasa (Gmail, dsb.)
 *
 * Sebelumnya kode hanya membaca variabel RESEND_*, sementara .env berisi
 * variabel SMTP_*. Tidak ada yang cocok, sehingga setiap pengiriman diam-diam
 * jatuh ke mode mock dan tetap melaporkan "berhasil".
 */
function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM;
  return apiKey && from ? { apiKey, from } : null;
}

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  return {
    host,
    port,
    // Port 465 memakai TLS langsung; port lain memakai STARTTLS.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    user,
    pass,
    from: process.env.EMAIL_FROM ?? user,
  };
}

export function getEmailProvider(): "resend" | "smtp" | null {
  if (resendConfig()) return "resend";
  if (smtpConfig()) return "smtp";
  return null;
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== null;
}

// Koneksi SMTP dipakai ulang antar pemanggilan; membuka koneksi baru setiap
// kirim membuat Gmail lambat merespons dan mudah kena pembatasan.
const globalForMail = globalThis as unknown as { mailer?: Transporter };

function getSmtpTransport(cfg: NonNullable<ReturnType<typeof smtpConfig>>) {
  if (!globalForMail.mailer) {
    globalForMail.mailer = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
  }
  return globalForMail.mailer;
}

/** Memeriksa koneksi tanpa mengirim apa pun. Berguna untuk diagnosa. */
export async function verifyEmailConnection(): Promise<{
  ok: boolean;
  provider: string;
  error?: string;
}> {
  const smtp = smtpConfig();
  const resend = resendConfig();

  if (resend) return { ok: true, provider: "resend (kunci API terpasang)" };
  if (!smtp) return { ok: false, provider: "tidak ada", error: "Email belum dikonfigurasi." };

  try {
    await getSmtpTransport(smtp).verify();
    return { ok: true, provider: `smtp ${smtp.host}:${smtp.port}` };
  } catch (error) {
    return {
      ok: false,
      provider: `smtp ${smtp.host}:${smtp.port}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function sendEmail({
  to,
  subject,
  text,
  replyTo = process.env.EMAIL_REPLY_TO ?? process.env.SMTP_USER,
}: SendEmailOptions): Promise<SendEmailResult> {
  const provider = getEmailProvider();

  if (!provider) {
    // Di produksi, diam-diam "berhasil" jauh lebih berbahaya daripada gagal:
    // admin mengira peserta sudah diberi tahu padahal tidak ada yang terkirim.
    if (process.env.NODE_ENV === "production") {
      const message =
        "Email belum dikonfigurasi di server. Isi RESEND_API_KEY + RESEND_FROM_EMAIL, atau SMTP_HOST + SMTP_USER + SMTP_PASS.";
      console.error("[EMAIL] " + message);
      return { success: false, provider: "mock", error: message };
    }

    console.log("=".repeat(50));
    console.log("[EMAIL MOCK - belum dikonfigurasi, hanya dicetak]");
    console.log(`Kepada : ${to}`);
    console.log(`Subjek : ${subject}`);
    console.log(text);
    console.log("=".repeat(50));
    return { success: true, provider: "mock" };
  }

  try {
    if (provider === "resend") {
      const cfg = resendConfig()!;
      const { error } = await new Resend(cfg.apiKey).emails.send({
        from: cfg.from,
        to,
        subject,
        text,
        ...(replyTo ? { replyTo } : {}),
      });
      if (error) throw new Error(error.message);
      return { success: true, provider: "resend" };
    }

    const cfg = smtpConfig()!;
    await getSmtpTransport(cfg).sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    return { success: true, provider: "smtp" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengirim email";
    console.error(`[EMAIL] pengiriman lewat ${provider} gagal:`, message);
    return { success: false, provider, error: message };
  }
}
