# 🚀 Cache Busting Guide - Cara Mengatasi Issue Update Tidak Terlihat

## Problem
Ketika deploy versi baru ke Vercel, hasilnya belum terupdate di browser meskipun sudah di-deploy.

## Root Cause: Service Worker Cache
Service Worker menyimpan file dalam cache dan melayani dari cache lama ketika load halaman.

## Solusi Implementation

### Step 1: Update Cache Version di Service Worker
Setiap kali deploy versi baru, increment `CACHE_VERSION` di `service-worker.js`:

```javascript
// BEFORE (old version)
const CACHE_VERSION = '1.0.0';

// AFTER (new version)
const CACHE_VERSION = '1.0.1';  // atau '1.1.0', '2.0.0' dll
```

### Step 2: Commit & Push
```bash
git add service-worker.js
git commit -m "Update cache version to 1.0.1"
git push origin main
```

### Step 3: Deploy ke Vercel
Push otomatis trigger deploy (atau manual via Vercel dashboard)

### Step 4: User melakukan refresh
1. Buka aplikasi di browser
2. Tekan **Ctrl+F5** (Windows) atau **Cmd+Shift+R** (Mac) - Hard Refresh
3. Atau buka Developer Tools → Settings → Disable Cache (centang), refresh

## Cara Kerja

### Network-First Strategy (HTML Files)
- `index.html` dan `admin.html` selalu diminta dari server dulu
- Jika server tidak bisa diakses, baru pakai cache
- ✅ Selalu mendapat versi terbaru

### Cache-First Strategy (Static Assets)
- CSS, JS, images diminta dari cache dulu
- Jika tidak ada di cache, fetch dari server
- Cache diupdate setiap kali ada request baru

### Automatic Cache Cleanup
- Service Worker otomatis hapus cache lama saat activate
- Hanya cache dengan `CACHE_VERSION` terbaru yang disimpan

## Versioning Convention

Gunakan semantic versioning:
- `1.0.0` → Initial release
- `1.0.1` → Bug fixes
- `1.1.0` → New features (minor)
- `2.0.0` → Breaking changes (major)

## Testing Locally

```bash
# Build & serve locally
python -m http.server 8000

# Atau gunakan VS Code Live Server extension

# Test Service Worker:
# 1. Open DevTools → Application → Service Workers
# 2. Check cache di Application → Cache Storage
# 3. Manual unregister & refresh untuk test update
```

## Checklist untuk Deploy

- [ ] Test lokal dengan hard refresh
- [ ] Update `CACHE_VERSION` di service-worker.js
- [ ] Commit dengan pesan jelas
- [ ] Push ke GitHub
- [ ] Verify di Vercel deployment
- [ ] Test di production URL dengan hard refresh

## FAQ

**Q: Berapa sering saya perlu update CACHE_VERSION?**
A: Setiap kali ada perubahan code dan deploy ke production

**Q: Apa bedanya hard refresh vs normal refresh?**
- Normal refresh: Pakai cache lama jika ada
- Hard refresh (Ctrl+F5): Force reload semua assets dari server

**Q: Bagaimana user tahu untuk hard refresh?**
Anda bisa tambahkan pesan di halaman:
```javascript
// Di app.js
console.log('App Version: 1.0.1');
```

**Q: Apakah Service Worker akan otomatis update?**
A: Tidak. Browser akan check service-worker.js setiap kali ke halaman. Jika berbeda, akan install version baru saat user refresh halaman.

---

**Last Updated:** February 25, 2026
