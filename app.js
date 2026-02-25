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

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
let lat = "", long = "", fullAddress = "";

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

    const q = query(collection(db, "daftar_anggota"), where("nama", "==", namaInput), where("sekbid", "==", sekbidInput));
    const snap = await getDocs(q);

    if (snap.empty) {
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
        
        // Request location permission with explicit prompt
        requestLocationPermission();
    } catch (e) {
        alert("Mohon izinkan akses kamera! 📷");
    }
}

function requestLocationPermission() {
    // Show loading indicator
    document.getElementById('loc-info').innerText = `📍 Mendeteksi lokasi...`;
    
    // Request geolocation with timeout and explicit error handling
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            // SUCCESS: Location granted
            try {
                lat = position.coords.latitude;
                long = position.coords.longitude;
                
                // Try to get address from coordinates
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`);
                    const data = await res.json();
                    fullAddress = data.display_name;
                } catch (e) {
                    // Fallback to coordinates only
                    fullAddress = `${lat.toFixed(4)}, ${long.toFixed(4)}`;
                }
                
                document.getElementById('loc-info').innerText = `📍 ${fullAddress}`;
            } catch (e) {
                console.error("Location error:", e);
                fullAddress = `${lat.toFixed(4)}, ${long.toFixed(4)}`;
                document.getElementById('loc-info').innerText = `📍 ${fullAddress}`;
            }
        },
        (error) => {
            // ERROR: Location permission denied or unavailable
            console.error("Geolocation error:", error);
            
            let errorMsg = "Lokasi tidak terdeteksi";
            if (error.code === error.PERMISSION_DENIED) {
                errorMsg = "⚠️ Izin lokasi ditolak! Aktifkan di pengaturan browser.";
                alert("📍 PENTING: Mohon izinkan akses lokasi di pengaturan browser Anda!");
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMsg = "⚠️ Lokasi tidak tersedia";
            } else if (error.code === error.TIMEOUT) {
                errorMsg = "⚠️ Request lokasi timeout";
            }
            
            fullAddress = errorMsg;
            document.getElementById('loc-info').innerText = errorMsg;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

document.getElementById('btnAbsen').onclick = async () => {
    const status = document.querySelector('input[name="status"]:checked').value;
    const alasan = status === "Hadir" ? "-" : (document.getElementById('alasan')?.value || "");
    const btn = document.getElementById('btnAbsen');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const photo = canvas.toDataURL('image/jpeg', 0.5);

    await addDoc(collection(db, "presensi_log"), {
        nama: document.getElementById('nama').value,
        sekbid: document.getElementById('sekbid').value,
        status,
        alasan: alasan,
        waktu: new Date().toLocaleString('id-ID'),
        lokasi: { lat, long, alamat: fullAddress },
        foto: photo
    });
    document.getElementById('presence-step').classList.add('hidden');
    document.getElementById('success-step').classList.remove('hidden');
};