let globalData = [];
let companyName = "NAMA PERUSAHAAN";
const $ = id => document.getElementById(id);

// Format ke Rupiah
function rupiah(n) { 
  return new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(n||0);
}

// Fungsi utama: Mengambil data JSON
async function loadDataDariJSON() {
  try {
    $('list').innerHTML = '<div class="loading">Mengambil data terbaru...</div>';
    
    // Sesuaikan nama file/URL ini. Untuk tes lokal gunakan 'data.json'
    const url = 'data.json'; 
    
    // Parameter waktu mencegah browser menyimpan cache lama
    const response = await fetch(url + '?t=' + new Date().getTime()); 
    
    if (!response.ok) throw new Error("Gagal mengambil data");
    
    const jsonData = await response.json();
    globalData = jsonData.transactions || [];
    companyName = jsonData.company || "NAMA PERUSAHAAN";
    
    $('companyName').textContent = companyName;
    render(); // Tampilkan ke layar
    
  } catch (error) {
    console.error(error);
    $('list').innerHTML = '<div class="empty" style="color:red;">Gagal memuat data. Pastikan file data.json tersedia.</div>';
  }
}

// Fungsi untuk merender list laporan ke HTML
function render() {
  const from = $('from').value;
  const to = $('to').value;
  
  // Filter berdasarkan rentang tanggal jika dipilih
  let arr = globalData.filter(x => (!from || x.date >= from) && (!to || x.date <= to))
                      .sort((a,b) => b.date.localeCompare(a.date) || b.id - a.id);
                      
  // Hitung total
  let ins = arr.filter(x => x.type === 'masuk').reduce((s,x) => s + x.amount, 0);
  let outs = arr.filter(x => x.type === 'keluar').reduce((s,x) => s + x.amount, 0);
  
  $('sumIn').textContent = rupiah(ins);$('sumOut').textContent = rupiah(outs);
  $('balance').textContent = rupiah(ins - outs);$('printTitle').textContent = companyName + ' — Laporan Dana';
  
  // Jika kosong
  if (!arr.length) {
    $('list').innerHTML = '<div class="empty">Belum ada transaksi pada periode ini.</div>';
    return;
  }
  
  // Looping data menjadi elemen HTML
  $('list').innerHTML = arr.map(x => `
  <div class="row">
    <div class="col-date">
      <b>${x.date}</b>
      <div class="small">${x.type === 'masuk' ? 'DANA MASUK' : 'DANA KELUAR'}</div>
    </div>
    
    <div class="col-note">
      <b>${escapeHtml(x.note || '-')}</b>
      <div class="photo-cell no-print">
        ${x.photo ? `<img class="report-photo" src="${x.photo}" onclick="viewPhoto('${x.photo}')" alt="Lampiran">` : ''}
      </div>
    </div>
    
    <div class="col-amount ${x.type === 'masuk' ? 'in' : 'out'}">
      ${x.type === 'masuk' ? '+' : '−'} ${rupiah(x.amount)}
    </div>
  </div>`).join('');
}

// Mencegah error karakter HTML khusus
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

// Fitur klik foto perbesar
function viewPhoto(src) {
  let w = window.open();
  w.document.write(`<title>Lampiran</title><body style="margin:0; background:#222; display:flex; align-items:center; justify-content:center; height:100vh;"><img src="${src}" style="max-width:90%; max-height:90%; border-radius:8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></body>`);
}

// Jalankan otomatis saat web selesai dimuat
window.addEventListener('DOMContentLoaded', loadDataDariJSON);