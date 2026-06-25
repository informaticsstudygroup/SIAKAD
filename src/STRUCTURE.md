```text
src/
├── app/              # App Router: Pages, Layouts, Loading, Error, Route Handlers
├── components/       # Komponen UI global (misal: Button, Navbar, Footer)
├── features/         # Logic bisnis berbasis fitur (Module-based)
│   └── auth/         # Contoh fitur auth
│       ├── components/
│       ├── hooks/
│       └── services/
├── lib/              # Inisialisasi library pihak ketiga (Prisma, Axios, NextAuth)
├── store/            # State management (Zustand, Redux, atau Context)
└── utils/            # Helper functions (date formatting, validation, dll)
```
