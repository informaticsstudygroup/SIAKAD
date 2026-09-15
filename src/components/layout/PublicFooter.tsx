import Link from "next/link";
import Image from "next/image";

const LINK_GROUPS = [
  {
    title: "Jelajahi",
    links: [
      { label: "Tentang ISG", href: "/#tentang" },
      { label: "Materi", href: "/#materi" },
      { label: "Kelas", href: "/#kelas" },
      { label: "Alur belajar", href: "/#alur" },
    ],
  },
  {
    title: "Akun",
    links: [
      { label: "Daftar ISG", href: "/register" },
      { label: "Masuk", href: "/login" },
      { label: "Lupa kata sandi", href: "/forgot-password" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-isg-line bg-isg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
        <div className="flex max-w-sm flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Image src="/LOGOISG.png" alt="" width={30} height={30} aria-hidden />
            <span className="text-[15px] font-extrabold tracking-tight text-isg-ink">
              Informatics Study Group SIAKAD
            </span>
          </div>
          <p className="text-sm text-isg-muted">
            Informatics Study Group — komunitas belajar teknologi bagi mahasiswa yang ingin
            berkembang lewat kelas, proyek, dan kolaborasi.
          </p>
        </div>

        <div className="flex flex-wrap gap-10 sm:gap-16">
          {LINK_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2.5">
              <span className="text-sm font-extrabold text-isg-ink">{group.title}</span>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-isg-muted transition-colors hover:text-isg-blue"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-extrabold text-isg-ink">Kontak</span>
            <a
              href="mailto:halo@isg.dev"
              className="text-sm text-isg-muted transition-colors hover:text-isg-blue"
            >
              halo@isg.dev
            </a>
            <a
              href="https://instagram.com/isg.community"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-isg-muted transition-colors hover:text-isg-blue"
            >
              @isg.community
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-isg-line px-4 py-5 text-center text-xs text-isg-muted sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} Informatics Study Group. Seluruh hak cipta
        dilindungi.
      </div>
    </footer>
  );
}
