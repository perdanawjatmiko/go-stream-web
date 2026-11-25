# go-stream-web (KDKMP Webinar Frontend)

Antarmuka web super ringan untuk platform webinar **KDKMP (`go-stream`)**, dibangun menggunakan **Svelte 5 (Runes)**, **SvelteKit (`@sveltejs/adapter-static`)**, **Vite**, dan **Tailwind CSS v4** tanpa dependensi UI runtime berat.

## Fitur Antarmuka

- **Ruang Webinar Split-View (`/video`):**
  - *YouTube Theater* yang mematuhi kebijakan YouTube IFrame API (tanpa elemen overlay di atas layar video), dilengkapi kontrol SVG kustom, pencatat waktu tonton otomatis + `sendBeacon`, dan atribusi hak cipta.
  - Panel interaksi *sticky* dengan tab **Tanya Jawab (kuota 2 pertanyaan)** dan **Kuis Live** yang terhubung secara *real-time* via **Server-Sent Events (SSE)**.
- **Portal Administrator (`/admin`):**
  - Navigasi sidebar responsif, Dashboard statistik, Manajemen Video YouTube, Studio Kuis Langsung, Manajemen Peserta, serta Laporan Kehadiran & Pertanyaan lengkap dengan ekspor `.xlsx`.

## Menjalankan Secara Lokal

Pastikan server backend `go-stream` sudah berjalan di `http://localhost:8080`, lalu jalankan:

```powershell
npm install
npm run dev
```

Aplikasi dapat diakses di `http://localhost:5173` (proxy `/api` dan `/health` otomatis diarahkan ke `http://localhost:8080`). Untuk mengarahkan ke URL backend lain saat development, set environment variable `BACKEND_URL`.

## Build Produksi (Static SPA)

```powershell
npm run check
npm run build
```

Hasil build statis murni (+ prekompresi `.gz` dan `.br`) akan tersedia di direktori `build/` dan siap disajikan oleh Nginx / CDN (lihat contoh konfigurasi di `Dockerfile` dan `nginx.conf`).
