# Sistem Absensi Digital OSIS SMKN 56 Jakarta

Aplikasi modern untuk manajemen absensi digital dengan fitur capture foto, geolokasi, dan admin dashboard.

## Fitur Utama

✨ **Fitur Pengguna:**
- Login dengan verifikasi nama dan sekbid
- Capture foto real-time dengan webcam
- Deteksi lokasi otomatis (GPS + GeoCoding)
- Pilihan status: Hadir, Izin, Sakit/Absen
- Form alasan untuk status tidak hadir

🛡️ **Fitur Admin:**
- Dashboard dengan statistik kehadiran
- Tabel rekap aktivitas real-time
- Statistik per orang dengan grafik
- Manajemen anggota (tambah, edit, hapus)
- Filter data berdasarkan bulan
- Export data ke CSV/Excel
- Hapus data massal per bulan

## Teknologi

- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend:** Firebase (Firestore, Storage)
- **Hosting:** Vercel
- **Browser APIs:** Geolocation, Canvas, Media Stream

## Struktur File

```
ABSENSI/
├── index.html          # Halaman login & absensi
├── admin.html          # Dashboard admin
├── app.js              # Logic untuk halaman absensi
├── admin.js            # Logic untuk dashboard admin
├── style.css           # Styling global
├── Logo MPK rev..png   # Logo MPK
├── Logo OSIS rev. (1).png  # Logo OSIS
└── README.md           # File ini
```

## Cara Menggunakan

### Untuk Pengguna
1. Buka halaman login (index.html)
2. Masukkan nama lengkap
3. Pilih sekbid dari dropdown
4. Klik "Masuk ke Presensi"
5. Berikan izin akses kamera dan lokasi
6. Pilih status kehadiran
7. Klik "Kirim Presensi" untuk submit

### Untuk Admin
1. Buka halaman admin (admin.html)
2. Lihat statistik kehadiran di dashboard
3. Filter data berdasarkan bulan
4. Kelola anggota (tambah/edit/hapus)
5. Export data ke CSV dengan tombol "Unduh Excel"
6. Hapus data massal dengan tombol "Hapus Data Bulan Ini"

## Konfigurasi Firebase

Edit konfigurasi Firebase di app.js dan admin.js:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## Deployment

### Deploy ke Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login ke Vercel:
```bash
vercel login
```

3. Deploy project:
```bash
vercel
```

4. Ikuti instruksi di command line

Atau langsung melalui GitHub:
1. Push ke GitHub
2. Buka https://vercel.com
3. Klik "New Project"
4. Pilih repository Anda
5. Deploy!

## Fitur Keamanan

- Verifikasi nama & sekbid sebelum absensi
- Capture foto untuk bukti kehadiran
- Deteksi lokasi untuk validasi temperatur geografis
- Data disimpan terenkripsi di Firestore
- Firebase Rules untuk proteksi akses

## Browser Support

- Chrome/Edge (v90+)
- Firefox (v88+)
- Safari (v14+)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Design

✅ Mobile-first responsive design
✅ Optimized untuk semua device (320px - 4K)
✅ Touch-friendly interface
✅ Fast loading times

## Contact & Support

Untuk pertanyaan atau laporan bug, hubungi admin OSIS SMKN 56 Jakarta.

---

Dikembangkan dengan ❤️ untuk OSIS SMKN 56 Jakarta
