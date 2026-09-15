import nodemailer from "nodemailer";

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
};

/**
 * Memeriksa apakah SMTP telah dikonfigurasi di file lingkungan (.env).
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Mengirimkan email transaksional.
 * Jika SMTP belum dikonfigurasi, email akan di-log ke console (dev mock) agar
 * pengujian lokal tidak mengalami crash.
 */
export async function sendEmail({
  to,
  subject,
  text,
}: SendEmailOptions): Promise<{ success: boolean; mocked?: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.log("==================================================");
    console.log("📧 [EMAIL DEV MODE / MOCK - SMTP BELUM DIKONFIGURASI]");
    console.log(`Kepada  : ${to}`);
    console.log(`Subjek  : ${subject}`);
    console.log("Konten  :\n" + text);
    console.log("==================================================");
    return { success: true, mocked: true };
  }

  try {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "465");
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const rawFrom = process.env.EMAIL_FROM;
    const from = rawFrom
      ? rawFrom.replace(/^["']|["']$/g, "").replace(/\\"/g, '"')
      : `"Informatics Study Group" <${user}>`;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengirim email";
    console.error("[EMAIL ERROR] Pengiriman email gagal:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

