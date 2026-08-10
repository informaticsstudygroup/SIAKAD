"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email atau NIM wajib diisi."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export type LoginFormState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    await signIn("credentials", {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error:
              "Email/NIM atau kata sandi salah, atau akun belum diverifikasi admin.",
          };
        default:
          return { error: "Terjadi kesalahan saat masuk. Silakan coba lagi." };
      }
    }
    // NEXT_REDIRECT dilempar oleh signIn saat berhasil — biarkan navigasi berjalan.
    throw error;
  }
}
