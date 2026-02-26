import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// KONFIGURASI FIREBASE
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

// ELEMENT SELECTORS
const listRekap = document.getElementById('rekap-list');
const listIndividu = document.getElementById('individu-list');
const listAnggota = document.getElementById('anggota-list');
const statsContainer = document.getElementById('stats-container');
const filterBulan = document.getElementById('filter-bulan');

// --- FUNGSI LOAD DASHBOARD (STATISTIK & LOG) ---
function loadDashboard(bulanFilter = "Semua") {
    const q = query(collection(db, "presensi_log"), orderBy("waktu", "desc"));
    
    onSnapshot(q, (snap) => {
        listRekap.innerHTML = "";
        listIndividu.innerHTML = "";
        let statsSekbid = {};
        let statsOrang = {};

        snap.forEach(docSnap => {
            const d = docSnap.data();
            const waktuParts = d.waktu ? d.waktu.split('/') : ['01', '01', '2026'];
            const bulanData = parseInt(waktuParts[1]) || 1;

            if (bulanFilter === "Semua" || bulanData === parseInt(bulanFilter)) {
                // RENDER TABEL LOG REKAP
                listRekap.innerHTML += `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-4">
                        <div class="font-bold text-slate-800">${d.nama}</div>
                        <div class="text-[10px] text-slate-400 font-bold uppercase">${d.sekbid}</div>
                    </td>
                    <td class="p-4">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-black ${d.status === 'Hadir' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}">${d.status.toUpperCase()}</span>
                        <p class="text-[11px] text-slate-400 mt-1 italic truncate w-32">${d.alasan || '-'}</p>
                    </td>
                    <td class="p-4 text-[11px]">
                        <div class="font-bold text-slate-700">${d.waktu || '-'}</div>
                        <div class="text-blue-500 truncate w-40 mt-0.5">${d.lokasi?.alamat || 'Tidak Terdeteksi'}</div>
                    </td>
                    <td class="p-4"><img src="${d.foto || ''}" class="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm hover:scale-150 transition-all onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'"></td>
                    <td class="p-4 text-center">
                        <button data-log-id="${docSnap.id}" class="btn-hapus-rekap text-red-500 font-bold text-xs hover:underline">HAPUS</button>
                    </td>
                </tr>`;

                // LOGIKA HITUNG
                if (!statsSekbid[d.sekbid]) statsSekbid[d.sekbid] = { hadir: 0, izin: 0, absen: 0 };
                if (!statsOrang[d.nama]) statsOrang[d.nama] = { sekbid: d.sekbid, hadir: 0, izin: 0, absen: 0 };

                if (d.status === "Hadir") { statsSekbid[d.sekbid].hadir++; statsOrang[d.nama].hadir++; }
                else if (d.status === "Izin") { statsSekbid[d.sekbid].izin++; statsOrang[d.nama].izin++; }
                else { statsSekbid[d.sekbid].absen++; statsOrang[d.nama].absen++; }
            }
        });

        // RENDER TABEL INDIVIDU
        for (const [nama, data] of Object.entries(statsOrang)) {
            listIndividu.innerHTML += `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-bold text-slate-700">${nama}</td>
                <td class="p-4 text-xs font-medium text-slate-400">${data.sekbid}</td>
                <td class="p-4 text-center font-bold text-green-600">${data.hadir}</td>
                <td class="p-4 text-center font-bold text-blue-500">${data.izin}</td>
                <td class="p-4 text-center font-bold text-red-400">${data.absen}</td>
                <td class="p-4 text-center font-black bg-slate-50 text-slate-800">${data.hadir + data.izin + data.absen}</td>
            </tr>`;
        }

        // RENDER CARDS SEKBID
        statsContainer.innerHTML = "";
        for (const [bidang, c] of Object.entries(statsSekbid)) {
            statsContainer.innerHTML += `
            <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm stats-card">
                <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">${bidang}</h3>
                <div class="flex justify-between items-end">
                    <div>
                        <div class="text-3xl font-black text-slate-900">${c.hadir + c.izin + c.absen}</div>
                        <div class="text-[10px] font-bold text-slate-400">Total Laporan</div>
                    </div>
                    <div class="text-[10px] font-bold text-right">
                        <div class="text-green-600">H: ${c.hadir}</div>
                        <div class="text-blue-500">I: ${c.izin}</div>
                        <div class="text-red-500">A/S: ${c.absen}</div>
                    </div>
                </div>
            </div>`;
        }
    });
}

// --- MANAJEMEN ANGGOTA ---
let currentEditId = null;

onSnapshot(collection(db, "daftar_anggota"), (snap) => {
    listAnggota.innerHTML = "";
    snap.forEach(docSnap => {
        const d = docSnap.data();
        const id = docSnap.id;
        listAnggota.innerHTML += `
        <tr class="hover:bg-slate-50 transition">
            <td class="p-4 font-bold text-slate-700">${d.nama}</td>
            <td class="p-4 text-slate-500">${d.sekbid}</td>
            <td class="p-4 text-center space-x-4">
                <button data-id="${id}" data-nama="${d.nama}" data-sekbid="${d.sekbid}" class="btn-edit text-blue-600 font-bold text-xs hover:underline">EDIT</button>
                <button data-id="${id}" class="btn-hapus text-red-500 font-bold text-xs hover:underline">HAPUS</button>
            </td>
        </tr>`;
    });
});

// EVENT LISTENER TAMBAH ANGGOTA
document.getElementById('btnTambah').onclick = async () => {
    const nama = document.getElementById('add-nama').value.trim();
    const sekbid = document.getElementById('add-sekbid').value.trim();
    if(!nama || !sekbid) return alert("Isi data!");
    await addDoc(collection(db, "daftar_anggota"), { nama, sekbid });
    document.getElementById('add-nama').value = ""; document.getElementById('add-sekbid').value = "";
    alert("Berhasil!");
};

// EVENT DELEGATION UNTUK HAPUS & EDIT
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-hapus')) {
        const id = e.target.getAttribute('data-id');
        if(confirm("Hapus anggota ini?")) await deleteDoc(doc(db, "daftar_anggota", id));
    }
    if (e.target.classList.contains('btn-edit')) {
        const id = e.target.getAttribute('data-id');
        const nama = e.target.getAttribute('data-nama');
        const sekbid = e.target.getAttribute('data-sekbid');
        
        currentEditId = id;
        document.getElementById('edit-nama').value = nama;
        document.getElementById('edit-sekbid').value = sekbid;
        document.getElementById('modal-edit').classList.remove('hidden');
    }
});

// MODAL EDIT HANDLER
document.getElementById('btn-cancel-edit').onclick = () => {
    document.getElementById('modal-edit').classList.add('hidden');
    currentEditId = null;
};

document.getElementById('btn-save-edit').onclick = async () => {
    if (!currentEditId) return;
    
    const namaBaru = document.getElementById('edit-nama').value.trim();
    const sekbidBaru = document.getElementById('edit-sekbid').value.trim();
    
    if (!namaBaru || !sekbidBaru) {
        alert("Nama dan Sekbid tidak boleh kosong!");
        return;
    }
    
    try {
        await updateDoc(doc(db, "daftar_anggota", currentEditId), {
            nama: namaBaru,
            sekbid: sekbidBaru
        });
        document.getElementById('modal-edit').classList.add('hidden');
        currentEditId = null;
        alert("Data anggota berhasil diperbarui!");
    } catch (error) {
        alert("Gagal memperbarui data: " + error.message);
    }
};

// CLOSE MODAL KETIKA KLIK DI LUAR
document.getElementById('modal-edit').onclick = (e) => {
    if (e.target.id === 'modal-edit') {
        document.getElementById('modal-edit').classList.add('hidden');
        currentEditId = null;
    }
};

// EVENT DELEGATION UNTUK HAPUS REKAP SATUAN
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-hapus-rekap')) {
        const logId = e.target.getAttribute('data-log-id');
        if(confirm("Hapus data presensi ini?")) {
            try {
                await deleteDoc(doc(db, "presensi_log", logId));
                alert("✅ Data presensi berhasil dihapus!");
            } catch (error) {
                alert("❌ Gagal menghapus: " + error.message);
            }
        }
    }
});

// --- TABS & FILTER LOGIC ---
const switchTab = (target) => {
    ['rekap', 'individu', 'kelola'].forEach(t => {
        document.getElementById(`section-${t}`).classList.add('hidden');
        document.getElementById(`tab-${t}`).classList.replace('text-slate-900', 'text-slate-400');
        document.getElementById(`tab-${t}`).classList.remove('tab-active');
    });
    document.getElementById(`section-${target}`).classList.remove('hidden');
    document.getElementById(`tab-${target}`).classList.add('tab-active');
    document.getElementById(`tab-${target}`).classList.replace('text-slate-400', 'text-slate-900');
};

document.getElementById('tab-rekap').onclick = () => switchTab('rekap');
document.getElementById('tab-individu').onclick = () => switchTab('individu');
document.getElementById('tab-kelola').onclick = () => switchTab('kelola');

filterBulan.onchange = (e) => loadDashboard(e.target.value);

// EVENT LISTENER EXPORT EXCEL
document.getElementById('btnExcelUnduh').onclick = async () => {
    try {
        const bulanFilter = document.getElementById('filter-bulan').value;
        const btn = document.getElementById('btnExcelUnduh');
        const originalText = btn.innerText;
        
        btn.innerText = "⏳ Mengekspor...";
        btn.disabled = true;

        const q = query(collection(db, "presensi_log"), orderBy("waktu", "desc"));
        const snap = await getDocs(q);
        
        let data = [];
        snap.forEach(docSnap => {
            const d = docSnap.data();
            const waktuParts = d.waktu ? d.waktu.split('/') : ['01', '01', '2026'];
            const bulanData = parseInt(waktuParts[1]);
            
            if (bulanFilter === "Semua" || bulanData === parseInt(bulanFilter)) {
                data.push({
                    'Nama': d.nama || '-',
                    'Sekbid': d.sekbid || '-',
                    'Status': d.status || '-',
                    'Alasan': d.alasan || '-',
                    'Waktu': d.waktu || '-',
                    'Lokasi': d.lokasi?.alamat || 'Tidak Terdeteksi'
                });
            }
        });

        if (data.length === 0) {
            alert("❌ Tidak ada data untuk diekspor pada periode yang dipilih!");
            btn.innerText = originalText;
            btn.disabled = false;
            return;
        }

        // GENERATE CSV
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => {
            return headers.map(header => {
                let value = row[header];
                // Escape commas dan quotes di values
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            }).join(',');
        }).join('\n');

        const csvContent = csvHeaders + '\n' + csvRows;

        // CREATE BLOB & DOWNLOAD
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const tanggalSekarang = new Date();
        const bulanNama = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const namaBulan = bulanFilter === "Semua" ? "Semua_Bulan" : bulanNama[parseInt(bulanFilter)];
        const filename = `Rekap_Absensi_${namaBulan}_${tanggalSekarang.getFullYear()}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`✅ File CSV berhasil diunduh!\nFile: ${filename}\nTotal Data: ${data.length} baris\n\n💡 Tip: Buka dengan Microsoft Excel untuk format terbaik.`);
        
        btn.innerText = originalText;
        btn.disabled = false;
    } catch (error) {
        console.error("Error export detail:", error);
        alert(`❌ Gagal mengekspor data!\n\nError: ${error.message}`);
        document.getElementById('btnExcelUnduh').disabled = false;
        document.getElementById('btnExcelUnduh').innerText = "Unduh Excel";
    }
};

// INIT
loadDashboard();

document.getElementById('btnHapusMassal').onclick = async () => {
    const bulanDipilih = document.getElementById('filter-bulan').value;
    
    if (bulanDipilih === "Semua") {
        return alert("Pilih bulan spesifik di menu periode terlebih dahulu!");
    }

    if (confirm(`Apakah Anda yakin ingin menghapus SEMUA data di bulan ke-${bulanDipilih}?`)) {
        const btn = document.getElementById('btnHapusMassal');
        const originalText = btn.innerText;
        
        btn.innerText = "⏳ Sedang Menghapus...";
        btn.disabled = true;

        try {
            const querySnapshot = await getDocs(collection(db, "presensi_log"));
            const batchDelete = [];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const waktuStr = data.waktu || "";
                
                // Mendeteksi pemisah tanggal (bisa / atau -)
                const separator = waktuStr.includes('/') ? '/' : '-';
                const parts = waktuStr.split(separator);

                if (parts.length >= 2) {
                    // Bagian bulan biasanya ada di indeks ke-1 (DD/MM/YYYY)
                    const bulanData = parseInt(parts[1]); 

                    if (bulanData === parseInt(bulanDipilih)) {
                        batchDelete.push(deleteDoc(doc(db, "presensi_log", docSnap.id)));
                    }
                }
            });

            if (batchDelete.length > 0) {
                // Menunggu semua proses hapus selesai di server
                await Promise.all(batchDelete);
                alert(`✅ Berhasil menghapus ${batchDelete.length} data bulan ke-${bulanDipilih}.`);
                // Halaman akan otomatis terupdate karena onSnapshot tetap aktif
            } else {
                alert("ℹ️ Tidak ditemukan data yang cocok dengan bulan tersebut.");
            }
        } catch (error) {
            console.error("Error Detail:", error);
            alert("❌ Gagal menghapus. Cek konsol browser untuk detail error.");
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
};