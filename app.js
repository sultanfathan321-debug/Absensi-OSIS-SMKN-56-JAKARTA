import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCjmVrUDv3mAejCfeshxbTwZug-Qp6QhI",
    authDomain: "absensi-1d974.firebaseapp.com",
    projectId: "absensi-1d974",
    storageBucket: "absensi-1d974.firebasestorage.app",
    messagingSenderId: "516696928778",
    appId: "1:516696928778:web:fbeaa0060d00ee56211"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hide loading screen after page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        const appContainer = document.getElementById('app');
        if (loadingScreen && appContainer) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                appContainer.classList.add('visible');
            }, 600);
        }
    }, 2000);
});

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
let lat = "", long = "", accuracy = "", fullAddress = "";
let isCameraActive = false;
let isLocationActive = false;

// --- FITUR BARU: AMBIL DAFTAR SEKBID DARI DATABASE ---
async function loadSekbidFromDB() {
    const sekbidSelect = document.getElementById('sekbid');
    try {
        const snap = await getDocs(collection(db, "daftar_anggota"));
        let setSekbid = new Set();

        snap.forEach(doc => setSekbid.add(doc.data().sekbid));

        sekbidSelect.innerHTML = '<option value="">Pilih Sekbid</option>';
        setSekbid.forEach(s => {
            sekbidSelect.innerHTML += `<option value="${s}">${s}</option>`;
        });
    } catch (e) {
        sekbidSelect.innerHTML = '<option value="">Gagal memuat Sekbid</option>';
    }
}
loadSekbidFromDB();

// --- LOGIKA FORM ---
document.querySelectorAll('input[name="status"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const container = document.getElementById('alasan-container');
        e.target.value === "Hadir" ? container.classList.add('hidden') : container.classList.remove('hidden');
    });
});

document.getElementById('btnLogin').onclick = async () => {
    const namaInput = document.getElementById('nama').value.trim();
    const sekbidInput = document.getElementById('sekbid').value;
    const btn = document.getElementById('btnLogin');

    if (!namaInput || !sekbidInput) return alert("Isi Nama dan Sekbid!");
    btn.innerText = "Memverifikasi...";
    btn.disabled = true;

    // Query case-insensitive: ambil semua dengan sekbid yang sama, filter nama di JavaScript
    const q = query(collection(db, "daftar_anggota"), where("sekbid", "==", sekbidInput));
    const snap = await getDocs(q);

    // Cari nama dengan case-insensitive comparison
    const ditemukan = snap.docs.some(doc => doc.data().nama.toLowerCase() === namaInput.toLowerCase());

    if (!ditemukan) {
        alert("Nama/Sekbid tidak terdaftar!");
        btn.innerText = "Verifikasi & Masuk";
        btn.disabled = false;
    } else {
        document.getElementById('login-step').classList.add('hidden');
        document.getElementById('presence-step').classList.remove('hidden');
        initCamera();
    }
};

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        isCameraActive = true;

        // Request location permission with explicit prompt
        requestLocationPermission();
    } catch (e) {
        isCameraActive = false;
        alert("⚠️ Mohon izinkan akses kamera untuk melanjutkan presensi! 📷");
    }
}

function requestLocationPermission() {
    const locInfoEl = document.getElementById('loc-info');
    locInfoEl.innerText = `📍 Meminta izin lokasi...`;
    locInfoEl.style.color = '#3b82f6';

    // Retry logic untuk location request
    const attemptGetLocation = (retries = 3) => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // SUCCESS: Location granted
                try {
                    // Check for Mock Location (Fake GPS)
                    // Note: 'mocked' is available in some browser environments like Android WebView/Chrome
                    if (position.mocked || (position.coords.accuracy < 1 && position.coords.accuracy > 0)) {
                        isLocationActive = false;
                        fullAddress = "❌ Fake GPS Terdeteksi!";
                        locInfoEl.innerText = fullAddress;
                        locInfoEl.style.color = '#ef4444';
                        alert("⚠️ Fake GPS/Lokasi Tiruan terdeteksi! Mohon gunakan lokasi asli.");
                        return;
                    }

                    lat = position.coords.latitude;
                    long = position.coords.longitude;
                    accuracy = position.coords.accuracy;
                    isLocationActive = true;

                    // Try to get address from coordinates
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`, {
                            timeout: 5000
                        });
                        const data = await res.json();
                        fullAddress = data.display_name || `${lat.toFixed(4)}, ${long.toFixed(4)}`;
                    } catch (e) {
                        // Fallback to coordinates only
                        fullAddress = `${lat.toFixed(4)}, ${long.toFixed(4)}`;
                    }

                    locInfoEl.innerText = `✅ ${fullAddress}`;
                    locInfoEl.style.color = '#10b981';
                } catch (e) {
                    console.error("Location processing error:", e);
                    fullAddress = `${lat.toFixed(4)}, ${long.toFixed(4)}`;
                    locInfoEl.innerText = `✅ ${fullAddress}`;
                    locInfoEl.style.color = '#10b981';
                }
            },
            (error) => {
                // ERROR: Location permission denied or unavailable
                isLocationActive = false;
                console.error("Geolocation error code:", error.code, "Message:", error.message);

                let errorMsg = "Lokasi tidak terdeteksi";
                let bgColor = '#ef4444';

                if (error.code === 1) { // PERMISSION_DENIED
                    errorMsg = "❌ Izin lokasi ditolak";
                    // Tunjukkan instruksi lebih detail
                    alert(`📍 Instruksi untuk mengaktifkan lokasi:\n\n` +
                        `📱 (Smartphone):\n` +
                        `1. Buka Settings → Privacy/Permissions\n` +
                        `2. Cari Location/Lokasi\n` +
                        `3. Izinkan akses untuk Chrome/Firefox/Safari\n` +
                        `4. Kembali ke app ini dan refresh halaman\n\n` +
                        `💻 (Browser Desktop):\n` +
                        `1. Klik kunci/info icon di address bar\n` +
                        `2. Pilih "Allow" untuk Location\n` +
                        `3. Refresh halaman ini`);
                } else if (error.code === 2) { // POSITION_UNAVAILABLE
                    errorMsg = "⏳ Lokasi sedang dideteksi... Tunggu sebentar";
                    bgColor = '#f59e0b';
                    // Retry setelah 3 detik
                    if (retries > 0) {
                        setTimeout(() => attemptGetLocation(retries - 1), 3000);
                    }
                } else if (error.code === 3) { // TIMEOUT
                    errorMsg = "⏱️ Timeout - Lokasi terlalu lama";
                    if (retries > 0) {
                        setTimeout(() => attemptGetLocation(retries - 1), 2000);
                    }
                }

                fullAddress = errorMsg;
                locInfoEl.innerText = errorMsg;
                locInfoEl.style.color = bgColor;
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,  // Increase timeout untuk mobile yang lebih lambat
                maximumAge: 0    // Tidak pakai cached location
            }
        );
    };

    // Mulai dengan attempt kali pertama
    attemptGetLocation();
}

// Make requestLocationPermission globally accessible for refresh button
window.requestLocationPermission = requestLocationPermission;

document.getElementById('btnAbsen').onclick = async () => {
    // 1. Validasi Kamera
    if (!isCameraActive) {
        alert("⚠️ Kamera belum aktif atau izin ditolak! Mohon izinkan kamera untuk mengambil foto presensi.");
        return;
    }

    // 2. Validasi Lokasi
    if (!isLocationActive || !lat || !long) {
        alert("⚠️ Lokasi belum terdeteksi! Pastikan GPS aktif dan izin lokasi diberikan.");
        return;
    }

    const status = document.querySelector('input[name="status"]:checked').value;
    const alasan = status === "Hadir" ? "-" : (document.getElementById('alasan')?.value || "");
    const btn = document.getElementById('btnAbsen');

    try {
        btn.disabled = true;
        btn.innerText = "Mengirim...";

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const photo = canvas.toDataURL('image/jpeg', 0.5);

        // Security check: ensure photo is not empty
        if (photo.length < 1000) {
            alert("⚠️ Gagal mengambil foto. Silakan coba lagi.");
            btn.disabled = false;
            btn.innerText = "Kirim Presensi";
            return;
        }

        await addDoc(collection(db, "presensi_log"), {
            nama: document.getElementById('nama').value,
            sekbid: document.getElementById('sekbid').value,
            status,
            alasan: alasan,
            waktu: new Date().toLocaleString('id-ID'),
            lokasi: { lat, long, alamat: fullAddress, accuracy },
            foto: photo
        });

        document.getElementById('presence-step').classList.add('hidden');
        document.getElementById('success-step').classList.remove('hidden');
    } catch (e) {
        console.error("Submission error:", e);
        alert("Gagal mengirim presensi: " + e.message);
        btn.disabled = false;
        btn.innerText = "Kirim Presensi";
    }
};