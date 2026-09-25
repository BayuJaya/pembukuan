let globalData = [];
let companyName = "NAMA PERUSAHAAN";
const $ = id => document.getElementById(id);

// Format ke Rupiah
function rupiah(n) { 
  return new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(n||0);
}

// --- Fungsi utama: Mengambil data JSON ---
async function loadDataDariJSON() {
  try {
    document.getElementById('list').innerHTML = '<div class="loading">Mengambil data terbaru...</div>';
    
    // Gunakan jalur RAW agar tidak terkena limit API 60x/jam
    const url = 'https://raw.githubusercontent.com/BayuJaya/pembukuan/main/data.json';
    
    // Memaksa browser mengabaikan cache lama dengan parameter waktu dan no-store
    const response = await fetch(url + '?t=' + new Date().getTime(), {
      cache: 'no-store' 
    }); 
    
    if (!response.ok) throw new Error("Gagal mengambil data");
    
    const jsonData = await response.json();
    globalData = jsonData.transactions || [];
    companyName = jsonData.company || "NAMA PERUSAHAAN";
    
    document.getElementById('companyName').textContent = companyName;
    render(); // Tampilkan ke layar
    
  } catch (error) {
    console.error(error);
    document.getElementById('list').innerHTML = '<div class="empty" style="color:red;">Gagal memuat data. Pastikan file data.json ada di GitHub.</div>';
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
  
  // Update logika download khusus untuk link (URL) gambar
  btnDownload.onclick = async function() {
    try {
      // Menarik data gambar dari link untuk dipaksa unduh (force download)
      btnDownload.innerText = "Mengunduh...";
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'bukti_transaksi_' + new Date().getTime() + '.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      btnDownload.innerText = "Unduh Bukti";
    } catch(e) {
      // Jika browser memblokir download otomatis, buka di tab baru sebagai alternatif
      window.open(src, '_blank');
      btnDownload.innerText = "Unduh Bukti";
    }
  };
}

function closePhoto() {
  document.getElementById('photoModal').style.display = 'none';
}

// Jalankan otomatis saat web selesai dimuat
window.addEventListener('DOMContentLoaded', loadDataDariJSON);
