let menu = JSON.parse(localStorage.getItem('v6_menu')) || [];
let sales = JSON.parse(localStorage.getItem('v6_sales')) || [];
let settings = JSON.parse(localStorage.getItem('v6_set')) || { nama: '', alamat: '', qris: '' };
let cart = [];
let metode = 'tunai';

function toggleSidebar() { document.body.classList.toggle('sidebar-closed'); }

window.onload = () => {
    if (settings.nama) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        renderApp();
    }
};

function handleLogin() {
    settings.nama = document.getElementById('setupNamaWarung').value;
    settings.alamat = document.getElementById('setupAlamatWarung').value;
    if (settings.nama) {
        localStorage.setItem('v6_set', JSON.stringify(settings));
        location.reload();
    }
}

function renderApp() {
    document.getElementById('dispNama').innerText = settings.nama;
    document.getElementById('dispAlamat').innerText = settings.alamat;
    if(settings.qris) document.getElementById('qrisDisplay').src = settings.qris;
    renderProduk();
    renderInventory();
}

function switchPage(p) {
    document.querySelectorAll('.page').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(e => e.classList.remove('active'));
    document.getElementById('page' + p.charAt(0).toUpperCase() + p.slice(1)).classList.add('active');
    document.getElementById('link' + p.charAt(0).toUpperCase() + p.slice(1)).classList.add('active');
    if (p === 'laporan') renderLaporan();
    if (p === 'produk') renderInventory();
}

// FUNGSI SIMPAN QRIS (PERBAIKAN)
function simpanQRIS(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            settings.qris = e.target.result;
            localStorage.setItem('v6_set', JSON.stringify(settings));
            document.getElementById('qrisDisplay').src = settings.qris;
            alert("✅ QRIS Berhasil Disimpan!");
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function simpanProduk() {
    const nama = document.getElementById('pNama').value;
    const modal = parseInt(document.getElementById('pModal').value);
    const harga = parseInt(document.getElementById('pHarga').value);
    const foto = document.getElementById('pFoto').files[0];

    if (!nama || !modal || !harga) return alert("Lengkapi data barang!");

    const add = (img) => {
        menu.push({ id: Date.now(), nama, modal, harga, img });
        localStorage.setItem('v6_menu', JSON.stringify(menu));
        alert("Barang tersimpan!");
        location.reload();
    };

    if (foto) {
        const reader = new FileReader();
        reader.onload = (e) => add(e.target.result);
        reader.readAsDataURL(foto);
    } else { add('https://via.placeholder.com/150?text=Barang'); }
}

function renderInventory() {
    const body = document.getElementById('listBarangInput');
    body.innerHTML = '';
    menu.forEach((m, i) => {
        body.innerHTML += `
            <tr>
                <td><b>${m.nama}</b></td>
                <td>Rp ${m.modal.toLocaleString()}</td>
                <td>Rp ${m.harga.toLocaleString()}</td>
                <td style="color:green; font-weight:bold">+Rp ${(m.harga-m.modal).toLocaleString()}</td>
                <td><button onclick="hapusBarang(${i})" class="btn-del">Hapus</button></td>
            </tr>`;
    });
}

function hapusBarang(i) {
    if(confirm("Hapus barang ini?")) {
        menu.splice(i, 1);
        localStorage.setItem('v6_menu', JSON.stringify(menu));
        renderInventory();
        renderProduk();
    }
}

function renderProduk() {
    const grid = document.getElementById('productGrid');
    const cari = document.getElementById('cariMenu').value.toLowerCase();
    grid.innerHTML = '';
    menu.filter(m => m.nama.toLowerCase().includes(cari)).forEach(m => {
        grid.innerHTML += `
            <div class="p-card" onclick="addToCart(${m.id})">
                <img src="${m.img}">
                <div class="p-info"><b>${m.nama}</b><br>Rp ${m.harga.toLocaleString()}</div>
            </div>`;
    });
}

function addToCart(id) {
    const p = menu.find(x => x.id === id);
    const ada = cart.find(x => x.id === id);
    if (ada) ada.qty++; else cart.push({ ...p, qty: 1 });
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartList');
    let total = 0; list.innerHTML = '';
    cart.forEach((item, i) => {
        total += item.harga * item.qty;
        list.innerHTML += `<div class="c-item">
            <span>${item.nama} x${item.qty}</span>
            <span>Rp ${(item.harga * item.qty).toLocaleString()} <b onclick="cart.splice(${i},1);renderCart()">×</b></span>
        </div>`;
    });
    document.getElementById('totalHarga').innerText = `Rp ${total.toLocaleString()}`;
    hitungKembalian();
}

function setMetode(m) {
    metode = m;
    document.getElementById('tabTunai').classList.toggle('active', m === 'tunai');
    document.getElementById('tabQRIS').classList.toggle('active', m === 'qris');
    document.getElementById('inputTunai').style.display = m === 'tunai' ? 'block' : 'none';
    document.getElementById('inputQRIS').style.display = m === 'qris' ? 'block' : 'none';
}

function hitungKembalian() {
    const total = parseInt(document.getElementById('totalHarga').innerText.replace(/\D/g,''));
    const bayar = document.getElementById('uangBayar').value || 0;
    document.getElementById('kembalian').innerText = `Rp ${(bayar - total > 0 ? bayar - total : 0).toLocaleString()}`;
}

function prosesTransaksi() {
    const totalStr = document.getElementById('totalHarga').innerText;
    if (totalStr === 'Rp 0') return alert("Pilih barang dulu!");

    const t = {
        waktu: new Date().toLocaleString(),
        nama: document.getElementById('namaPembeli').value || "Umum",
        total: parseInt(totalStr.replace(/\D/g,'')),
        modal: cart.reduce((acc, curr) => acc + (curr.modal * curr.qty), 0),
        metode: metode.toUpperCase(),
        items: [...cart]
    };

    sales.push(t);
    localStorage.setItem('v6_sales', JSON.stringify(sales));

    document.getElementById('sToko').innerText = settings.nama;
    document.getElementById('sAlamat').innerText = settings.alamat;
    document.getElementById('sWaktu').innerText = t.waktu;
    document.getElementById('sNama').innerText = t.nama;
    document.getElementById('sTotal').innerText = totalStr;

    let html = '';
    cart.forEach(i => html += `<div class="s-row"><span>${i.nama} x${i.qty}</span><span>${(i.harga*i.qty).toLocaleString()}</span></div>`);
    document.getElementById('sItems').innerHTML = html;
    document.getElementById('modalStruk').style.display = 'flex';
}

function renderLaporan() {
    const body = document.getElementById('lapBody');
    let totalOmzet = 0; let totalModal = 0;
    body.innerHTML = '';
    sales.slice().reverse().forEach(s => {
        totalOmzet += s.total;
        totalModal += s.modal;
        body.innerHTML += `<tr><td>${s.waktu}</td><td>${s.nama}</td><td>${s.metode}</td><td>Rp ${s.total.toLocaleString()}</td></tr>`;
    });
    document.getElementById('lapTotal').innerText = `Rp ${totalOmzet.toLocaleString()}`;
    document.getElementById('lapModal').innerText = `Rp ${totalModal.toLocaleString()}`;
    document.getElementById('lapProfit').innerText = `Rp ${(totalOmzet - totalModal).toLocaleString()}`;
}

function kirimWhatsApp() {
    const total = document.getElementById('sTotal').innerText;
    let pesan = `*STRUK ${settings.nama}*%0A%0A`;
    cart.forEach(i => pesan += `${i.nama} x${i.qty} = Rp ${(i.harga*i.qty).toLocaleString()}%0A`);
    pesan += `%0A*TOTAL: ${total}*%0ATerima Kasih!`;
    window.open(`https://wa.me/?text=${pesan}`, '_blank');
}

function tutupStruk() { document.getElementById('modalStruk').style.display='none'; cart=[]; renderCart(); }
function handleLogout() { if(confirm("Reset semua data?")) { localStorage.clear(); location.reload(); } }
setInterval(() => { document.getElementById('live-clock').innerText = new Date().toLocaleTimeString(); }, 1000);
