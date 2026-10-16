// Data Bawaan / Mock Data (Stok Internal)
const defaultBarangList = [
    { id: 1, sku: 'AST-001', nama: 'Kertas HVS A4 80gr', kategori: 'Perlengkapan', stok: 45, minStok: 10, satuan: 'Rim' },
    { id: 2, sku: 'AST-002', nama: 'Senter Lapangan LED', kategori: 'Peralatan', stok: 3, minStok: 5, satuan: 'Unit' },
    { id: 3, sku: 'AST-003', nama: 'Kabel Ethernet Cat6 10M', kategori: 'Suku Cadang', stok: 18, minStok: 5, satuan: 'Pcs' },
    { id: 4, sku: 'AST-004', nama: 'Lampu Sorot Gudang 50W', kategori: 'Peralatan', stok: 1, minStok: 3, satuan: 'Pcs' },
    { id: 5, sku: 'AST-005', nama: 'Masker Medis Box 50s', kategori: 'Perlengkapan', stok: 20, minStok: 5, satuan: 'Box' }
];

const defaultTransaksiList = [
    { id: 101, type: 'MASUK', barangId: 1, namaBarang: 'Kertas HVS A4 80gr', qty: 20, tanggal: '2026-03-28', sumber: 'Pengadaan Divisi GA', keterangan: 'Stok bulanan kantor' },
    { id: 102, type: 'KELUAR', barangId: 2, namaBarang: 'Senter Lapangan LED', qty: 2, tanggal: '2026-03-29', sumber: 'Tim Patroli Malam', keterangan: 'Pemakaian operasional' }
];

// Inisialisasi State dengan LocalStorage
let barangList = JSON.parse(localStorage.getItem('gudang_barang_list')) || defaultBarangList;
let transaksiList = JSON.parse(localStorage.getItem('gudang_transaksi_list')) || defaultTransaksiList;
let chartInstance = null;

// Simpan Ke LocalStorage
function saveToStorage() {
    localStorage.setItem('gudang_barang_list', JSON.stringify(barangList));
    localStorage.setItem('gudang_transaksi_list', JSON.stringify(transaksiList));
}

// Reset Data Demo
function resetDataToDefault() {
    if (confirm('Apakah Anda yakin ingin mengembalikan data stok ke kondisi awal / demo?')) {
        barangList = [...defaultBarangList];
        transaksiList = [...defaultTransaksiList];
        saveToStorage();
        renderDashboard();
        renderBarangTable();
        renderTransaksiTables();
        showToast('Data stok berhasil di-reset ke versi demo', 'rotate-ccw', 'text-sky-400');
    }
}

// Event saat aplikasi siap
window.onload = function() {
    if (window.lucide) lucide.createIcons();
    updateCurrentDate();
    renderDashboard();
    renderBarangTable();
    renderTransaksiTables();
    initChart();
};

// Tanggal Hari Ini
function updateCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = today.toLocaleDateString('id-ID', options);
    
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    const laporanDate = document.getElementById('laporanDate');

    if (currentDateDisplay) currentDateDisplay.textContent = dateStr;
    if (laporanDate) laporanDate.textContent = dateStr;
}

// Toast Notification System
function showToast(message, iconName = 'check-circle', colorClass = 'text-emerald-400') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast || !toastMessage || !toastIcon) return;

    toastMessage.textContent = message;
    toastIcon.setAttribute('data-lucide', iconName);
    toastIcon.className = `w-5 h-5 shrink-0 ${colorClass}`;
    if (window.lucide) lucide.createIcons();

    toast.classList.remove('translate-x-full');
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 3500);
}

// Beralih Tampilan Tab
function switchTab(tabKey) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-sky-600', 'text-white');
        el.classList.add('text-slate-400');
    });

    const activeTab = document.getElementById(`view-${tabKey}`);
    const activeNav = document.getElementById(`nav-${tabKey}`);
    const pageTitle = document.getElementById('pageTitle');

    if (activeTab) activeTab.classList.remove('hidden');
    if (activeNav) {
        activeNav.classList.add('bg-sky-600', 'text-white');
        activeNav.classList.remove('text-slate-400');
    }

    const titles = {
        dashboard: 'Dashboard Overview',
        'Gudang Stock Barang': 'Gudang Stock Barang',
        masuk: 'Riwayat Barang Masuk (+Stok)',
        keluar: 'Riwayat Barang Keluar (-Stok)',
        laporan: 'Laporan Rekapitulasi Stok'
    };
    if (pageTitle) pageTitle.textContent = titles[tabKey] || 'Dashboard';

    if (tabKey === 'dashboard') renderDashboard();
    if (tabKey === 'masuk' || tabKey === 'keluar') renderTransaksiTables();
    if (tabKey === 'laporan') renderLaporan();

    if (window.lucide) lucide.createIcons();
}

// Render Dashboard Statistics & Log
function renderDashboard() {
    const totalJenis = barangList.length;
    const totalStok = barangList.reduce((acc, item) => acc + Number(item.stok), 0);
    const totalMasuk = transaksiList.filter(t => t.type === 'MASUK').reduce((acc, t) => acc + Number(t.qty), 0);
    const lowStockCount = barangList.filter(item => item.stok <= item.minStok).length;

    const elStatTotalJenis = document.getElementById('statTotalJenis');
    const elStatTotalStok = document.getElementById('statTotalStok');
    const elStatBarangMasuk = document.getElementById('statBarangMasuk');
    const elStatStokMenipis = document.getElementById('statStokMenipis');

    if (elStatTotalJenis) elStatTotalJenis.textContent = totalJenis;
    if (elStatTotalStok) elStatTotalStok.textContent = totalStok;
    if (elStatBarangMasuk) elStatBarangMasuk.textContent = totalMasuk;
    if (elStatStokMenipis) elStatStokMenipis.textContent = lowStockCount;

    // Peringatan Stok Menipis
    const lowStockContainer = document.getElementById('dashboardLowStockList');
    if (lowStockContainer) {
        const lowStockItems = barangList.filter(item => item.stok <= item.minStok);

        if (lowStockItems.length === 0) {
            lowStockContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Seluruh stok barang dalam kondisi cukup.</p>`;
        } else {
            lowStockContainer.innerHTML = lowStockItems.map(item => `
                <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                        <p class="font-bold text-slate-800 text-xs">${item.nama}</p>
                        <p class="text-[10px] text-amber-700 font-medium">SKU: ${item.sku}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-extrabold ${item.stok === 0 ? 'text-rose-600 bg-rose-100' : 'text-amber-600 bg-amber-100'} px-2 py-0.5 rounded-md">
                            ${item.stok} ${item.satuan}
                        </span>
                        <p class="text-[9px] text-slate-400 mt-0.5">Min Alert: ${item.minStok}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    // Mutasi Terakhir
    const recentTable = document.getElementById('recentTransactionsTable');
    if (recentTable) {
        const sortedTx = [...transaksiList].reverse().slice(0, 5);

        if (sortedTx.length === 0) {
            recentTable.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada catatan mutasi stok.</td></tr>`;
        } else {
            recentTable.innerHTML = sortedTx.map(tx => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-5 text-slate-500">${tx.tanggal}</td>
                    <td class="py-3 px-5">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${tx.type === 'MASUK' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                            ${tx.type === 'MASUK' ? '+ MASUK' : '- KELUAR'}
                        </span>
                    </td>
                    <td class="py-3 px-5 font-bold text-slate-800">${tx.namaBarang}</td>
                    <td class="py-3 px-5 font-bold ${tx.type === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'}">${tx.type === 'MASUK' ? '+' : '-'}${tx.qty}</td>
                    <td class="py-3 px-5 text-slate-500">${tx.sumber || '-'}</td>
                </tr>
            `).join('');
        }
    }

    updateChartData();
}

// Render Data Master
function renderBarangTable() {
    const tbody = document.getElementById('masterBarangTable');
    if (!tbody) return;

    const searchInput = document.getElementById('searchBarangInput');
    const keyword = searchInput ? searchInput.value.toLowerCase() : '';

    const filtered = barangList.filter(item => 
        item.nama.toLowerCase().includes(keyword) || 
        item.sku.toLowerCase().includes(keyword) ||
        item.kategori.toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Tidak ada barang yang cocok.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        let badge = `<span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Aman</span>`;
        if (item.stok <= 0) {
            badge = `<span class="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Stok Habis</span>`;
        } else if (item.stok <= item.minStok) {
            badge = `<span class="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Perlu Restock</span>`;
        }

        return `
            <tr class="hover:bg-slate-50 transition">
                <td class="py-3.5 px-5 font-mono text-slate-500 font-bold">${item.sku}</td>
                <td class="py-3.5 px-5 font-bold text-slate-800">${item.nama}</td>
                <td class="py-3.5 px-5 text-slate-500">${item.kategori}</td>
                <td class="py-3.5 px-5 text-center font-extrabold text-slate-800 bg-slate-50/50">${item.stok} <span class="text-[10px] font-normal text-slate-400">${item.satuan}</span></td>
                <td class="py-3.5 px-5">${badge}</td>
                <td class="py-3.5 px-5 text-right">
                    <div class="inline-flex items-center gap-1">
                        <button onclick="editBarang(${item.id})" title="Edit Barang" class="p-1.5 text-slate-400 hover:text-sky-600 transition hover:bg-sky-50 rounded-lg">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteBarang(${item.id})" title="Hapus Barang" class="p-1.5 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 rounded-lg">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Modal Barang
function showQuickAddBarang() {
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('barangForm');
    const idInput = document.getElementById('barangId');
    const modal = document.getElementById('barangModal');

    if (modalTitle) modalTitle.textContent = 'Tambah Barang Baru';
    if (form) form.reset();
    if (idInput) idInput.value = '';
    if (modal) modal.classList.remove('hidden');
}

function closeBarangModal() {
    const modal = document.getElementById('barangModal');
    if (modal) modal.classList.add('hidden');
}

function saveBarang(e) {
    e.preventDefault();
    const id = document.getElementById('barangId').value;
    const sku = document.getElementById('barangSku').value.trim();
    const nama = document.getElementById('barangNama').value.trim();
    const kategori = document.getElementById('barangKategori').value;
    const satuan = document.getElementById('barangSatuan').value.trim();
    const stok = Number(document.getElementById('barangStok').value);
    const minStok = Number(document.getElementById('barangMinStok').value);

    if (id) {
        const index = barangList.findIndex(b => b.id == id);
        if (index !== -1) {
            barangList[index] = { ...barangList[index], sku, nama, kategori, satuan, stok, minStok };
            showToast(`Data barang '${nama}' berhasil diperbarui!`);
        }
    } else {
        const newBarang = { id: Date.now(), sku, nama, kategori, satuan, stok, minStok };
        barangList.push(newBarang);
        showToast(`Barang '${nama}' berhasil ditambahkan ke inventaris!`);
    }

    saveToStorage();
    closeBarangModal();
    renderBarangTable();
    renderDashboard();
}

function editBarang(id) {
    const item = barangList.find(b => b.id === id);
    if (!item) return;

    document.getElementById('modalTitle').textContent = 'Edit Data Barang';
    document.getElementById('barangId').value = item.id;
    document.getElementById('barangSku').value = item.sku;
    document.getElementById('barangNama').value = item.nama;
    document.getElementById('barangKategori').value = item.kategori;
    document.getElementById('barangSatuan').value = item.satuan;
    document.getElementById('barangStok').value = item.stok;
    document.getElementById('barangMinStok').value = item.minStok;

    document.getElementById('barangModal').classList.remove('hidden');
}

function deleteBarang(id) {
    const item = barangList.find(b => b.id === id);
    if (confirm(`Hapus item '${item ? item.nama : 'barang ini'}' dari sistem?`)) {
        barangList = barangList.filter(b => b.id !== id);
        saveToStorage();
        renderBarangTable();
        renderDashboard();
        showToast('Item berhasil dihapus', 'trash-2', 'text-rose-400');
    }
}

// Transaksi Mutasi (Masuk / Keluar)
function openTransaksiModal(type) {
    if (barangList.length === 0) {
        showToast('Tambahkan data barang dulu di Master Stok!', 'alert-triangle', 'text-amber-400');
        return;
    }

    document.getElementById('transaksiType').value = type;
    const modalTitle = document.getElementById('transaksiModalTitle');
    const submitBtn = document.getElementById('transaksiSubmitBtn');
    const sumberLabel = document.getElementById('transaksiSumberLabel');
    const select = document.getElementById('transaksiBarangSelect');
    const modalHeader = document.getElementById('transaksiModalHeader');

    if (type === 'MASUK') {
        if (modalTitle) modalTitle.textContent = 'Input Barang Masuk (+Stok)';
        if (sumberLabel) sumberLabel.textContent = 'Asal / Sumber Barang';
        if (modalHeader) modalHeader.className = 'px-6 py-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50';
        if (submitBtn) submitBtn.className = 'px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2';
    } else {
        if (modalTitle) modalTitle.textContent = 'Input Barang Keluar (-Stok)';
        if (sumberLabel) sumberLabel.textContent = 'Penerima / Divisi Pemakai';
        if (modalHeader) modalHeader.className = 'px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/50';
        if (submitBtn) submitBtn.className = 'px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-lg shadow-rose-600/30 transition flex items-center gap-2';
    }

    if (select) {
        select.innerHTML = barangList.map(b => `<option value="${b.id}">${b.sku} - ${b.nama} (Tersedia: ${b.stok} ${b.satuan})</option>`).join('');
    }

    document.getElementById('transaksiQty').value = '';
    document.getElementById('transaksiSumber').value = '';
    document.getElementById('transaksiKeterangan').value = '';
    document.getElementById('transaksiTanggal').value = new Date().toISOString().split('T')[0];

    updateSelectedStockPreview();
    document.getElementById('transaksiModal').classList.remove('hidden');
}

function updateSelectedStockPreview() {
    const select = document.getElementById('transaksiBarangSelect');
    if (!select) return;

    const selectedId = Number(select.value);
    const barang = barangList.find(b => b.id === selectedId);
    const infoText = document.getElementById('stokCurrentInfo');

    if (barang && infoText) {
        infoText.innerHTML = `<i data-lucide="box" class="w-3.5 h-3.5"></i> Stok fisik saat ini: <span class="font-black text-slate-800">${barang.stok} ${barang.satuan}</span>`;
        if (window.lucide) lucide.createIcons();
    }
}

function closeTransaksiModal() {
    const modal = document.getElementById('transaksiModal');
    if (modal) modal.classList.add('hidden');
}

function saveTransaksi(e) {
    e.preventDefault();
    const type = document.getElementById('transaksiType').value;
    const barangId = Number(document.getElementById('transaksiBarangSelect').value);
    const qty = Number(document.getElementById('transaksiQty').value);
    const tanggal = document.getElementById('transaksiTanggal').value;
    const sumber = document.getElementById('transaksiSumber').value.trim();
    const keterangan = document.getElementById('transaksiKeterangan').value.trim();

    const barang = barangList.find(b => b.id === barangId);
    if (!barang) {
        showToast('Barang tidak ditemukan!', 'alert-circle', 'text-rose-400');
        return;
    }

    if (type === 'KELUAR' && barang.stok < qty) {
        showToast(`Stok '${barang.nama}' tidak cukup! (Stok tersedia: ${barang.stok} ${barang.satuan})`, 'alert-triangle', 'text-amber-400');
        return;
    }

    // Update stok fisik
    if (type === 'MASUK') barang.stok += qty;
    if (type === 'KELUAR') barang.stok -= qty;

    const newTx = { id: Date.now(), type, barangId, namaBarang: barang.nama, qty, tanggal, sumber, keterangan };
    transaksiList.push(newTx);

    saveToStorage();
    closeTransaksiModal();
    
    renderDashboard();
    renderBarangTable();
    renderTransaksiTables();

    const text = type === 'MASUK' ? `bertambah +${qty}` : `berkurang -${qty}`;
    showToast(`Stok '${barang.nama}' ${text} ${barang.satuan}. Total stok sekarang: ${barang.stok} ${barang.satuan}`, 
        type === 'MASUK' ? 'arrow-down-left' : 'arrow-up-right', 
        type === 'MASUK' ? 'text-emerald-400' : 'text-rose-400'
    );
}

function renderTransaksiTables() {
    const masukTable = document.getElementById('barangMasukTable');
    const keluarTable = document.getElementById('barangKeluarTable');

    if (masukTable) {
        const dataMasuk = transaksiList.filter(t => t.type === 'MASUK').reverse();
        masukTable.innerHTML = dataMasuk.length === 0 
            ? `<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada riwayat barang masuk.</td></tr>`
            : dataMasuk.map(t => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3.5 px-5 text-slate-500">${t.tanggal}</td>
                    <td class="py-3.5 px-5 font-bold text-slate-800">${t.namaBarang}</td>
                    <td class="py-3.5 px-5 font-extrabold text-emerald-600 bg-emerald-50/30">+${t.qty}</td>
                    <td class="py-3.5 px-5 text-slate-600">${t.sumber || '-'}</td>
                    <td class="py-3.5 px-5 text-slate-500">${t.keterangan || '-'}</td>
                </tr>
            `).join('');
    }

    if (keluarTable) {
        const dataKeluar = transaksiList.filter(t => t.type === 'KELUAR').reverse();
        keluarTable.innerHTML = dataKeluar.length === 0
            ? `<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada riwayat barang keluar.</td></tr>`
            : dataKeluar.map(t => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3.5 px-5 text-slate-500">${t.tanggal}</td>
                    <td class="py-3.5 px-5 font-bold text-slate-800">${t.namaBarang}</td>
                    <td class="py-3.5 px-5 font-extrabold text-rose-600 bg-rose-50/30">-${t.qty}</td>
                    <td class="py-3.5 px-5 text-slate-600">${t.sumber || '-'}</td>
                    <td class="py-3.5 px-5 text-slate-500">${t.keterangan || '-'}</td>
                </tr>
            `).join('');
    }
}

// Render Laporan PDF Area
function renderLaporan() {
    const tbody = document.getElementById('laporanTableBody');
    if (!tbody) return;
    tbody.innerHTML = barangList.map(item => `
        <tr>
            <td class="p-3 border border-slate-200 font-mono">${item.sku}</td>
            <td class="p-3 border border-slate-200 font-bold">${item.nama}</td>
            <td class="p-3 border border-slate-200">${item.kategori}</td>
            <td class="p-3 border border-slate-200 text-center font-bold">${item.stok} ${item.satuan}</td>
            <td class="p-3 border border-slate-200">${item.stok <= item.minStok ? 'Stok Menipis' : 'Cukup'}</td>
        </tr>
    `).join('');
}

// Visualisasi Grafik Bar
function initChart() {
    const chartEl = document.getElementById('stockChart');
    if (!chartEl || !window.Chart) return;
    const ctx = chartEl.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: barangList.map(b => b.nama.length > 14 ? b.nama.substring(0, 14) + '...' : b.nama),
            datasets: [{
                label: 'Jumlah Stok Fisik',
                data: barangList.map(b => b.stok),
                backgroundColor: '#0284c7',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateChartData() {
    if (!chartInstance) return;
    chartInstance.data.labels = barangList.map(b => b.nama.length > 14 ? b.nama.substring(0, 14) + '...' : b.nama);
    chartInstance.data.datasets[0].data = barangList.map(b => b.stok);
    chartInstance.update();
}