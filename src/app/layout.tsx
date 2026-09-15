import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Satu keluarga huruf saja, dibedakan lewat bobot. Geometris, bersih, dan
// kebetulan tipeface buatan Jakarta — pas untuk komunitas mahasiswa Indonesia.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Informatics Study Group SIAKAD",
    template: "%s | Informatics Study Group SIAKAD",
  },
  description:
    "Platform komunitas belajar Informatics Study Group (ISG): kelas, tugas, kuis, dan sertifikat dalam satu tempat.",
  icons: {
    icon: "/LOGOISG.png",
    apple: "/LOGOISG.png",
  },
  openGraph: {
    title: "Informatics Study Group SIAKAD",
    description:
      "Platform komunitas belajar Informatics Study Group (ISG): kelas, tugas, kuis, dan sertifikat dalam satu tempat.",
    type: "website",
    images: ["/LOGOISG.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
