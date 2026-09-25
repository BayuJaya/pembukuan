let globalData = [];
let companyName = "NAMA PERUSAHAAN";
const $ = id => document.getElementById(id);

// Format ke Rupiah
function rupiah(n) { 
  return new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(n||0);
}

// Fungsi utama: Mengambil data JSON secara REAL-TIME via GitHub API
async function loadDataDariJSON() {
  try {
    $('list').innerHTML = '<div class="loading">Mengambil data terbaru...</div>';
    
    // Memanggil API GitHub secara langsung agar tidak ada jeda cache
    const url = 'https://api.github.com/repos/BayuJaya/pembukuan/contents/data.json';
    
    // Memaksa browser untuk tidak menggunakan cache lama
    const response = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    }); 
    
    if (!response.ok) throw new Error("Gagal mengambil data dari API");
    
    const apiData = await response.json();
    
    // GitHub API mengirim isi file dalam format Base64, kita harus menerjemahkannya (Decode)
    const decodedContent = decodeURIComponent(escape(window.atob(apiData.content)));
    const jsonData = JSON.parse(decodedContent);
    
    globalData = jsonData.transactions || [];
    companyName = jsonData.company || "NAMA PERUSAHAAN";
    
    $('companyName').textContent = companyName;
    render(); // Tampilkan ke layar
    
  } catch (error) {
    console.error(error);
    $('list').innerHTML = '<div class="empty" style="color:red;">Gagal memuat data secara real-time. Pastikan internet stabil.</div>';
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

// --- Fungsi Pop-up Foto ---
function viewPhoto(src) {
  const modal = document.getElementById('photoModal');
  const img = document.getElementById('modalImg');
  const btnDownload = document.getElementById('btnDownload');
  
  img.src = src;
  modal.style.display = 'flex';
  
  // Setel href untuk tombol download
  btnDownload.onclick = function() {
    const a = document.createElement('a');
    a.href = src;
    a.download = 'bukti_transaksi_' + new Date().getTime() + '.png'; // Nama default saat diunduh
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
}

function closePhoto() {
  document.getElementById('photoModal').style.display = 'none';
}

// Jalankan otomatis saat web selesai dimuat
window.addEventListener('DOMContentLoaded', loadDataDariJSON);
