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
let unsubscribeDashboard = null; // simpan listener aktif

function loadDashboard(bulanFilter = "Semua") {
    // tutup listener lama agar tidak double render
    if (unsubscribeDashboard) {
        unsubscribeDashboard();
        unsubscribeDashboard = null;
    }

    const q = query(collection(db, "presensi_log"), orderBy("waktu", "desc"));

    unsubscribeDashboard = onSnapshot(q, (snap) => {
        listRekap.innerHTML = "";
        listIndividu.innerHTML = "";
        let statsSekbid = {};
        let statsOrang = {};
        let totalHadir = 0, totalIzin = 0, totalAbsen = 0;

        // NORMALISASI SEKBID — petakan nama lama/varian ke nama kanonik
        const SEKBID_ALIAS = {
            // Sekbid 1
            'keagamaan': 'Sekbid 1 Keagamaan dan Budi Pekerti Luhur',
            'keagamaan dan budi pekerti luhur': 'Sekbid 1 Keagamaan dan Budi Pekerti Luhur',
            'keagamaan & budi pekerti luhur': 'Sekbid 1 Keagamaan dan Budi Pekerti Luhur',
            'sekbid 1': 'Sekbid 1 Keagamaan dan Budi Pekerti Luhur',
            'sekbid 1 — keagamaan dan budi pekerti luhur': 'Sekbid 1 Keagamaan dan Budi Pekerti Luhur',
            // Sekbid 2
            'olahraga': 'Sekbid 2 Organisasi dan Olahraga',
            'organisasi dan olahraga': 'Sekbid 2 Organisasi dan Olahraga',
            'organisasi & olahraga': 'Sekbid 2 Organisasi dan Olahraga',
            'olahraga & organisasi': 'Sekbid 2 Organisasi dan Olahraga',
            'olaharaga & organisasi': 'Sekbid 2 Organisasi dan Olahraga',
            'olaharaga dan organisasi': 'Sekbid 2 Organisasi dan Olahraga',
            'sekbid 2': 'Sekbid 2 Organisasi dan Olahraga',
            'sekbid 2 — organisasi dan olahraga': 'Sekbid 2 Organisasi dan Olahraga',
            // Sekbid 3
            'kewirausahaan': 'Sekbid 3 Kewirausahaan',
            'sekbid 3': 'Sekbid 3 Kewirausahaan',
            'sekbid 3 — kewirausahaan': 'Sekbid 3 Kewirausahaan',
            // Sekbid 4
            'humas': 'Sekbid 4 Hubungan Masyarakat',
            'hubungan masyarakat': 'Sekbid 4 Hubungan Masyarakat',
            'sekbid 4': 'Sekbid 4 Hubungan Masyarakat',
            'sekbid 4 — hubungan masyarakat': 'Sekbid 4 Hubungan Masyarakat',
            // Sekbid 5
            'bela negara': 'Sekbid 5 Bela Negara dan Kehidupan Berbangsa',
            'belas negara': 'Sekbid 5 Bela Negara dan Kehidupan Berbangsa',
            'bela negara dan kehidupan berbangsa': 'Sekbid 5 Bela Negara dan Kehidupan Berbangsa',
            'belas negara dan kehidupan berbangsa': 'Sekbid 5 Bela Negara dan Kehidupan Berbangsa',
            'bela negara & kehidupan berbangsa': 'Sekbid 5 Bela Negara dan Kehidupan Berbangsa',
            'belas negara & kehidupan berbangsa': 'Sekbid 5 Bela Negara dan Kehidupan Berbangsa',
            'sekbid 5': 'Sekbid 5 Bela Negara dan Kehidupan Berbangsa',
            'sekbid 5 — bela negara dan kehidupan berbangsa': 'Sekbid 5 Bela Negara dan Kehidupan Berbangsa',
            // Sekbid 6
            'sastra': 'Sekbid 6 Sastra dan Bahasa',
            'sastra dan bahasa': 'Sekbid 6 Sastra dan Bahasa',
            'kesenian & sastra': 'Sekbid 6 Sastra dan Bahasa',
            'kesenian dan sastra': 'Sekbid 6 Sastra dan Bahasa',
            'sekbid 6': 'Sekbid 6 Sastra dan Bahasa',
            'sekbid 6 — sastra dan bahasa': 'Sekbid 6 Sastra dan Bahasa',
            // Sekbid 7
            'media': 'Sekbid 7 Media Publikasi',
            'media dan publikasi': 'Sekbid 7 Media Publikasi',
            'media & publikasi': 'Sekbid 7 Media Publikasi',
            'media publikasi': 'Sekbid 7 Media Publikasi',
            'teknologi': 'Sekbid 7 Media Publikasi',
            'sekbid 7': 'Sekbid 7 Media Publikasi',
            'sekbid 7 — media publikasi': 'Sekbid 7 Media Publikasi',
        };
        const normalizeSekbid = (raw) => {
            const key = (raw || '').trim().toLowerCase();
            return SEKBID_ALIAS[key] || (raw || '').trim();
        };

        snap.forEach(docSnap => {
            const d = docSnap.data();
            const waktuParts = d.waktu ? d.waktu.split('/') : ['01', '01', '2026'];
            const bulanData = parseInt(waktuParts[1]) || 1;

            if (bulanFilter === "Semua" || bulanData === parseInt(bulanFilter)) {
                // RENDER TABEL LOG REKAP
                const badgeClass = d.status === 'Hadir' ? 'badge-green' : (d.status === 'Izin' ? 'badge-blue' : 'badge-red');
                const statusIcon = d.status === 'Hadir'
                    ? '<svg width="11" height="11" style="flex-shrink:0"><use href="#icon-check-circle"/></svg>'
                    : (d.status === 'Izin'
                        ? '<svg width="11" height="11" style="flex-shrink:0"><use href="#icon-file-text"/></svg>'
                        : '<svg width="11" height="11" style="flex-shrink:0"><use href="#icon-x-circle"/></svg>');
                listRekap.innerHTML += `
                <tr>
                    <td>
                        <div class="td-primary">${d.nama}</div>
                        <div class="td-meta">${d.sekbid}</div>
                    </td>
                    <td>
                        <span class="badge ${badgeClass}" style="display:inline-flex;align-items:center;gap:0.25rem">${statusIcon} ${d.status}</span>
                        ${d.alasan ? `<div style="font-size:0.7rem;color:var(--ink-3);margin-top:0.3rem;font-style:italic;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.alasan}</div>` : ''}
                    </td>
                    <td>
                        <div style="font-size:0.8rem;font-weight:600;color:var(--ink-1)">${d.waktu || '—'}</div>
                        <div style="font-size:0.68rem;color:var(--blue);margin-top:0.15rem;max-width:175px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.lokasi?.alamat || 'Tidak Terdeteksi'}</div>
                    </td>
                    <td>
                        ${d.foto ? `<img src="${d.foto}" class="foto-thumb" alt="Foto">` : '<span style="color:var(--ink-4);font-size:0.78rem">—</span>'}
                    </td>
                    <td style="text-align:center">
                        <button data-log-id="${docSnap.id}" class="btn-icon btn-icon-red btn-hapus-rekap" title="Hapus">
                            <svg width="13" height="13"><use href="#icon-trash"/></svg>
                        </button>
                    </td>
                </tr>`;

                const sekbidNorm = normalizeSekbid(d.sekbid);

                // LOGIKA HITUNG
                if (!statsSekbid[sekbidNorm]) statsSekbid[sekbidNorm] = { hadir: 0, izin: 0, absen: 0 };
                if (!statsOrang[d.nama]) statsOrang[d.nama] = { sekbid: sekbidNorm, hadir: 0, izin: 0, absen: 0 };

                if (d.status === "Hadir") { statsSekbid[sekbidNorm].hadir++; statsOrang[d.nama].hadir++; totalHadir++; }
                else if (d.status === "Izin") { statsSekbid[sekbidNorm].izin++; statsOrang[d.nama].izin++; totalIzin++; }
                else { statsSekbid[sekbidNorm].absen++; statsOrang[d.nama].absen++; totalAbsen++; }
            }
        });

        // RENDER TABEL INDIVIDU — grouped by sekbid in defined order
        const SEKBID_ORDER = [
            'Ketua OSIS',
            'Wakil Ketua OSIS',
            'Sekretaris',
            'Bendahara',
            'Koordinator Sekbid',
            'Sekbid 1 Keagamaan dan Budi Pekerti Luhur',
            'Sekbid 2 Organisasi dan Olahraga',
            'Sekbid 3 Kewirausahaan',
            'Sekbid 4 Hubungan Masyarakat',
            'Sekbid 5 Bela Negara dan Kehidupan Berbangsa',
            'Sekbid 6 Sastra dan Bahasa',
            'Sekbid 7 Media Publikasi',
        ];

        const grouped = {};
        for (const [nama, data] of Object.entries(statsOrang)) {
            if (!grouped[data.sekbid]) grouped[data.sekbid] = [];
            grouped[data.sekbid].push({ nama, ...data });
        }

        // build sorted entries: known order first, then any extra
        const knownEntries = SEKBID_ORDER
            .filter(s => grouped[s])
            .map(s => [s, grouped[s]]);
        const extraEntries = Object.entries(grouped)
            .filter(([s]) => !SEKBID_ORDER.includes(s));
        const sortedEntries = [...knownEntries, ...extraEntries];

        for (const [sekbid, members] of sortedEntries) {
            const subH = members.reduce((s, m) => s + m.hadir, 0);
            const subI = members.reduce((s, m) => s + m.izin, 0);
            const subA = members.reduce((s, m) => s + m.absen, 0);

            // category header
            listIndividu.innerHTML += `
            <tr style="background:rgba(124,58,237,0.08);border-top:1px solid rgba(124,58,237,0.2)">
                <td colspan="3" style="padding:0.6rem 1rem">
                    <div style="display:flex;align-items:center;gap:0.5rem">
                        <div style="width:3px;height:14px;background:var(--violet);border-radius:2px;flex-shrink:0"></div>
                        <span style="font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--violet-light)">${sekbid}</span>
                        <span style="font-size:0.65rem;font-weight:600;color:var(--ink-3);margin-left:auto">${members.length} anggota</span>
                    </div>
                </td>
                <td class="num-green" style="background:rgba(124,58,237,0.08);font-size:0.78rem">${subH}</td>
                <td class="num-blue"  style="background:rgba(124,58,237,0.08);font-size:0.78rem">${subI}</td>
                <td class="num-red"   style="background:rgba(124,58,237,0.08);font-size:0.78rem">${subA}</td>
                <td class="num-ink"   style="background:rgba(124,58,237,0.08);font-size:0.78rem">${subH + subI + subA}</td>
            </tr>`;

            // member rows
            members.forEach((m, idx) => {
                listIndividu.innerHTML += `
                <tr>
                    <td colspan="3" style="padding:0.6rem 1rem 0.6rem 2rem">
                        <div style="display:flex;align-items:center;gap:0.55rem">
                            <span style="font-size:0.65rem;font-weight:700;color:var(--ink-4);width:18px;text-align:right;flex-shrink:0">${idx + 1}.</span>
                            <span class="td-primary" style="font-size:0.84rem">${m.nama}</span>
                        </div>
                    </td>
                    <td class="num-green" style="font-size:0.85rem">${m.hadir}</td>
                    <td class="num-blue"  style="font-size:0.85rem">${m.izin}</td>
                    <td class="num-red"   style="font-size:0.85rem">${m.absen}</td>
                    <td class="num-ink"   style="font-size:0.85rem">${m.hadir + m.izin + m.absen}</td>
                </tr>`;
            });
        }

        // Footer total keseluruhan
        if (Object.keys(statsOrang).length > 0) {
            const totalAll = totalHadir + totalIzin + totalAbsen;
            listIndividu.innerHTML += `
            <tr class="total-row" style="border-top:2px solid rgba(124,58,237,0.3)">
                <td colspan="3" style="padding:0.875rem 1rem;font-weight:800;color:var(--ink-1);font-size:0.78rem;letter-spacing:0.3px">
                    Total Keseluruhan &nbsp;<span style="font-size:0.65rem;font-weight:600;color:var(--ink-3)">(${Object.keys(statsOrang).length} anggota)</span>
                </td>
                <td class="num-green">${totalHadir}</td>
                <td class="num-blue">${totalIzin}</td>
                <td class="num-red">${totalAbsen}</td>
                <td class="num-ink" style="color:var(--violet-light)">${totalAll}</td>
            </tr>`;
        }

        // RENDER CARDS SUMMARY TOTAL (atas) + PER SEKBID (bawah)
        statsContainer.innerHTML = "";
        const totalKeseluruhan = totalHadir + totalIzin + totalAbsen;

        // --- 4 summary cards global ---
        const summaryCards = [
            { label: 'Total Hadir', value: totalHadir, iconRef: 'icon-check-circle', colorClass: 'stat-icon-green', pct: totalKeseluruhan ? Math.round(totalHadir / totalKeseluruhan * 100) : 0, pctColor: '#34d399' },
            { label: 'Total Izin', value: totalIzin, iconRef: 'icon-file-text', colorClass: 'stat-icon-blue', pct: totalKeseluruhan ? Math.round(totalIzin / totalKeseluruhan * 100) : 0, pctColor: '#60a5fa' },
            { label: 'Total Absen', value: totalAbsen, iconRef: 'icon-x-circle', colorClass: 'stat-icon-red', pct: totalKeseluruhan ? Math.round(totalAbsen / totalKeseluruhan * 100) : 0, pctColor: '#fc8181' },
            { label: 'Total Keseluruhan', value: totalKeseluruhan, iconRef: 'icon-users', colorClass: 'stat-icon-purple', pct: null, pctColor: '#a855f7' },
        ];

        const colorMap = { 'Total Hadir': 'si-green', 'Total Izin': 'si-blue', 'Total Absen': 'si-red', 'Total Keseluruhan': 'si-indigo' };
        summaryCards.forEach(({ label, value, iconRef, pct, pctColor }) => {
            const iconCls = colorMap[label] || 'si-indigo';
            statsContainer.innerHTML += `
            <div class="stat-card">
                <div class="stat-icon ${iconCls}">
                    <svg width="18" height="18"><use href="#${iconRef}"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                    <div class="stat-pct">${pct !== null ? `<b>${pct}%</b> dari total` : 'semua laporan'}</div>
                </div>
            </div>`;
        });

        // --- divider label per sekbid ---
        if (Object.keys(statsSekbid).length > 0) {
            statsContainer.innerHTML += `<div class="stat-divider">Per Sekretariat Bidang</div>`;
        }

        // --- per-sekbid cards ---
        const sekbidIconRef = { 'Humas': 'icon-users', 'Media dan Publikasi': 'icon-bar-chart', 'Teknologi': 'icon-settings' };
        const iconColors2 = ['si-indigo', 'si-green', 'si-blue', 'si-red', 'si-amber'];
        let iconIdx = 0;
        for (const [bidang, c] of Object.entries(statsSekbid)) {
            const iconRef = sekbidIconRef[bidang] || 'icon-file-text';
            const iconCls = iconColors2[iconIdx % iconColors2.length];
            iconIdx++;
            statsContainer.innerHTML += `
            <div class="stat-card">
                <div class="stat-icon ${iconCls}">
                    <svg width="18" height="18"><use href="#${iconRef}"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${c.hadir + c.izin + c.absen}</div>
                    <div class="stat-label">${bidang}</div>
                    <div class="stat-pct"><b style="color:var(--green)">${c.hadir}</b> H &middot; <b style="color:var(--blue)">${c.izin}</b> I &middot; <b style="color:var(--red)">${c.absen}</b> A</div>
                </div>
            </div>`;
        }
    });
}

// --- MANAJEMEN ANGGOTA ---
let currentEditId = null;
let allMembersDocs = [];

function renderAnggotaList() {
    const searchTerm = document.getElementById('search-anggota')?.value.toLowerCase() || "";
    listAnggota.innerHTML = "";

    // Sort members by name for better visibility
    const filteredDocs = allMembersDocs.filter(docSnap => {
        const d = docSnap.data();
        return d.nama.toLowerCase().includes(searchTerm) || d.sekbid.toLowerCase().includes(searchTerm);
    }).sort((a, b) => a.data().nama.localeCompare(b.data().nama));

    filteredDocs.forEach(docSnap => {
        const d = docSnap.data();
        const id = docSnap.id;
        listAnggota.innerHTML += `
        <tr>
            <td class="td-primary">${d.nama}</td>
            <td class="td-meta" style="text-transform:uppercase;letter-spacing:0.3px">${d.sekbid}</td>
            <td style="text-align:center">
                <button data-id="${id}" data-nama="${d.nama}" data-sekbid="${d.sekbid}" class="btn-icon btn-icon-blue btn-edit" title="Edit">
                    <svg width="13" height="13"><use href="#icon-edit"/></svg>
                </button>
                &nbsp;
                <button data-id="${id}" class="btn-icon btn-icon-red btn-hapus" title="Hapus">
                    <svg width="13" height="13"><use href="#icon-trash"/></svg>
                </button>
            </td>
        </tr>`;
    });
}

onSnapshot(collection(db, "daftar_anggota"), (snap) => {
    allMembersDocs = snap.docs;
    renderAnggotaList();
});

document.getElementById('search-anggota')?.addEventListener('input', renderAnggotaList);

// EVENT LISTENER TAMBAH ANGGOTA
document.getElementById('btnTambah').onclick = async () => {
    const nama = document.getElementById('add-nama').value.trim();
    const sekbid = document.getElementById('add-sekbid').value.trim();
    if (!nama || !sekbid) return alert("Isi data!");
    await addDoc(collection(db, "daftar_anggota"), { nama, sekbid });
    document.getElementById('add-nama').value = ""; document.getElementById('add-sekbid').value = "";
    alert("Berhasil!");
};

// EVENT DELEGATION UNTUK HAPUS & EDIT
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-hapus')) {
        const id = e.target.getAttribute('data-id');
        if (confirm("Hapus anggota ini?")) await deleteDoc(doc(db, "daftar_anggota", id));
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
        if (confirm("Hapus data presensi ini?")) {
            try {
                await deleteDoc(doc(db, "presensi_log", logId));
                alert("✅ Data presensi berhasil dihapus!");
            } catch (error) {
                alert("❌ Gagal menghapus: " + error.message);
            }
        }
    }
});

// --- TABS & FILTER LOGIC (handled by switchTab in admin.html inline script) ---

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