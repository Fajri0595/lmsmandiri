/** pages-nilai.js — Tugas & Penilaian (staf) dan Laporan (grafik, tabel, filter, ekspor Excel/PDF). */

/* =================== TUGAS & PENILAIAN =================== */
Pages.penilaian = function (parts) {
  var head = P.head('Tugas & Penilaian', 'Periksa pengumpulan peserta, beri nilai, dan umpan balik.');
  if (!S.nilai) { Sync.muatBerat('nilai'); return head + '<div class="g g12">' + '<div class="card">' + Ui.skel(5, 60) + '</div><div class="card">' + Ui.skel(4, 50) + '</div></div>'; }
  if (S.nilaiVer !== S.boot.versi && V.nlReq !== S.boot.versi) { V.nlReq = S.boot.versi; Sync.muatBerat('nilai'); }
  V.nl = V.nl || { st: 'perlu', kelas: '', q: '', sel: null };
  if (parts[1]) { V.nl.sel = parts[1]; V.nl.st = 'semua'; }
  var b = S.boot, tabs = [['perlu', 'Perlu dinilai'], ['dinilai', 'Sudah dinilai'], ['revisi', 'Revisi'], ['semua', 'Semua']];
  var list = Pages.nilaiFiltered();
  if (!V.nl.sel || !list.some(function (r) { return r.id === V.nl.sel; })) V.nl.sel = list[0] ? list[0].id : null;
  var kiri = '<section class="card flush"><div class="toolbar"><div class="tabs" style="max-width:100%">' + tabs.map(function (t) { return '<button class="' + (V.nl.st === t[0] ? 'on' : '') + '" data-act="nilTab" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div></div><div class="toolbar"><div class="iw grow" style="min-width:140px"><span>' + ico('search', 16) + '</span><input class="inp sm" style="width:100%;padding-left:38px" placeholder="Cari peserta/tugas" value="' + esc(V.nl.q) + '" data-in="nilQ"></div><select class="sel sm" data-ch="nilKelas">' + Ui.opt(b.kelas, 'id', 'nama', V.nl.kelas, 'Semua kelas') + '</select></div><div id="nil-list" style="max-height:68vh;overflow:auto;padding:8px">' + Pages.nilaiList(list) + '</div></section>';
  return head + '<div class="g g57" style="align-items:start">' + kiri + '<div id="nilai-detail">' + Pages.nilaiDetail() + '</div></div>';
};
Pages.nilaiFiltered = function () {
  var f = V.nl, q = f.q.toLowerCase();
  return (S.nilai || []).filter(function (r) { return r.terbaru; }).filter(function (r) {
    if (f.st === 'perlu' && r.status !== 'terkumpul' && r.status !== 'terlambat') return false;
    if (f.st === 'dinilai' && r.status !== 'dinilai') return false; if (f.st === 'revisi' && r.status !== 'revisi') return false;
    if (f.kelas && r.kelas_id !== f.kelas) return false;
    return !q || (r.peserta_nama + ' ' + r.tugas_judul).toLowerCase().indexOf(q) > -1;
  });
};
Pages.nilaiList = function (list) {
  if (!list.length) return Ui.empty('circleCheck', V.nl.st === 'perlu' ? 'Tidak ada tugas yang menunggu penilaian.' : 'Tidak ada data.');
  return list.slice(0, 60).map(function (r) {
    return '<div class="lrow click ' + (r.id === V.nl.sel ? 'sel' : '') + '" data-act="nilSel" data-id="' + esc(r.id) + '">' + Ui.avatar(r.peserta_nama) + '<div class="grow"><div class="t trunc">' + esc(r.peserta_nama) + '</div><div class="s trunc">' + esc(r.tugas_judul) + ' · ' + esc(r.kelas_nama) + '</div></div><div class="tr"><div class="sm mute">' + esc(Wkt.rel(r.waktu)) + '</div>' + (r.status === 'dinilai' ? '<b>' + Math.round(r.nilai) + '</b>' : Ui.badge(r.status)) + '</div></div>';
  }).join('') + (list.length > 60 ? '<div class="tc sm mute" style="padding:8px">Menampilkan 60 dari ' + list.length + '. Gunakan pencarian untuk mempersempit.</div>' : '');
};
Acts.nilTab = function (el) { V.nl.st = el.dataset.t; Ui.render(); };
Acts.nilQ = Ui.debounce(function (el) { V.nl.q = el.value; var l = Pages.nilaiFiltered(); if (!l.some(function (r) { return r.id === V.nl.sel; })) V.nl.sel = l[0] ? l[0].id : null; document.getElementById('nil-list').innerHTML = Pages.nilaiList(l); document.getElementById('nilai-detail').innerHTML = Pages.nilaiDetail(); }, 120);
Acts.nilKelas = function (el) { V.nl.kelas = el.value; Ui.render(); };
Acts.nilSel = function (el) { V.nl.sel = el.dataset.id; Ui.render(); if (innerWidth < 1100) { var d = document.getElementById('nilai-detail'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
Pages.nilaiDetail = function () {
  var r = (S.nilai || []).find(function (x) { return x.id === V.nl.sel; });
  if (!r) return '<section class="card">' + Ui.empty('clipboard', 'Pilih pengumpulan di sebelah kiri untuk memeriksa.') + '</section>';
  var riwayat = S.nilai.filter(function (x) { return x.tugas_id === r.tugas_id && x.peserta_id === r.peserta_id; }).sort(function (a, c) { return a.versi - c.versi; });
  var berkas = r.ada_file ? '<div class="filechip"><span class="fico">' + ico('file', 20) + '</span><div class="grow"><div class="b trunc">' + esc(r.nama_file) + '</div><div class="sm mute">' + Ui.ukuran(r.ukuran) + ' · versi ' + r.versi + '</div></div><button class="btn soft sm" data-act="ambilFile" data-tipe="kumpul" data-id="' + esc(r.id) + '">' + ico('download', 14) + ' Unduh</button></div>' : (r.tautan ? '<div class="filechip"><span class="fico">' + ico('link', 20) + '</span><div class="grow"><div class="b trunc">' + esc(r.tautan) + '</div><div class="sm mute">Tautan dari peserta</div></div><a class="btn soft sm" href="' + esc(r.tautan) + '" target="_blank" rel="noopener noreferrer">' + ico('link', 14) + ' Buka</a></div>' : '');
  var tl = riwayat.map(function (x) { return '<div class="stp ' + (x.id === r.id ? 'cur' : 'done') + '"><div class="dotp" style="font-size:11px;font-weight:700">v' + x.versi + '</div><div><div class="t">' + esc(Wkt.fmt(x.waktu)) + ' ' + Ui.badge(x.status) + '</div><div class="s">' + (x.status === 'dinilai' ? 'Nilai ' + Math.round(x.nilai) : x.nama_file ? esc(x.nama_file) : 'Tautan') + '</div></div></div>'; }).join('');
  return '<section class="card" style="position:sticky;top:80px"><div class="row sp wrap" style="margin-bottom:14px"><div class="row">' + Ui.avatar(r.peserta_nama, 'l') + '<div><h2>' + esc(r.peserta_nama) + '</h2><div class="sm mute">' + esc(r.peserta_email) + '</div></div></div>' + Ui.badge(r.status) + '</div>' +
    '<div class="g g2" style="gap:12px;margin-bottom:14px"><div><div class="sm mute">Kelas</div><div class="b">' + esc(r.kelas_nama) + '</div></div><div><div class="sm mute">Pertemuan</div><div class="b">' + esc(r.pertemuan_judul) + '</div></div><div><div class="sm mute">Tugas</div><div class="b">' + esc(r.tugas_judul) + '</div></div><div><div class="sm mute">Dikirim</div><div class="b">' + esc(Wkt.fmt(r.waktu)) + (r.status === 'terlambat' ? ' <span class="badge b-err">Terlambat</span>' : '') + '</div></div></div>' + berkas +
    (r.catatan ? '<div class="callout info mt16">' + ico('info', 18) + '<div><b>Catatan peserta</b><br>' + esc(r.catatan) + '</div></div>' : '') +
    (riwayat.length > 1 ? '<h3 style="margin:18px 0 10px">Riwayat versi</h3><div class="step-wrap">' + tl + '</div>' : '') +
    '<h3 style="margin:18px 0 10px">Penilaian</h3><div class="fld"><label>Nilai (0–100)</label><input type="number" min="0" max="100" class="inp" id="nl-nilai" value="' + (r.status === 'dinilai' ? Math.round(r.nilai) : '') + '" placeholder="Contoh: 85"></div><div class="fld mt8"><label>Umpan balik</label><textarea class="txt" id="nl-fb" maxlength="1000" placeholder="Tulis masukan yang membangun...">' + esc(r.umpan_balik || '') + '</textarea></div><div class="row wrap mt16" style="gap:10px"><button class="btn sec" data-act="nilSimpan" data-st="revisi" data-id="' + esc(r.id) + '">Minta revisi</button><button class="btn grow" data-act="nilSimpan" data-st="dinilai" data-id="' + esc(r.id) + '">' + ico('check', 16) + ' Simpan nilai</button></div></section>';
};
Acts.nilSimpan = function (el) {
  var id = el.dataset.id, st = el.dataset.st, row = S.nilai.find(function (x) { return x.id === id; }), nilai = Number(F('nl-nilai')), fb = F('nl-fb');
  if (st === 'dinilai' && (F('nl-nilai') === '' || !isFinite(nilai) || nilai < 0 || nilai > 100)) return Ui.toast('Isi nilai antara 0 dan 100.', 'err');
  var lama = Object.assign({}, row), b = S.boot, antre = b.antreanNilai.slice(), kid = row.kelas_id, wasPending = (row.status === 'terkumpul' || row.status === 'terlambat');
  K.aksi('nilai.simpan', { id: id, nilai: nilai, umpan_balik: fb, status: st }, {
    opt: function () { Object.assign(row, { status: st, nilai: st === 'dinilai' ? nilai : 0, umpan_balik: fb, dinilai_pada: Wkt.now() }); b.antreanNilai = b.antreanNilai.filter(function (a) { return a.id !== id; }); if (wasPending && b.ringkas[kid]) b.ringkas[kid].menunggu = Math.max(0, b.ringkas[kid].menunggu - 1); },
    undo: function () { Object.assign(row, lama); b.antreanNilai = antre; if (wasPending && b.ringkas[kid]) b.ringkas[kid].menunggu++; },
    ok: function (d) { Object.assign(row, d); }
  });
};

/* =================== LAPORAN =================== */
var LAP = [['progres', 'Progres Peserta', 'users'], ['retensi', 'Keaktifan & Retensi', 'chart'], ['nilai', 'Pengumpulan & Nilai', 'clipboard'], ['pasif', 'Peserta Pasif', 'alert'], ['notif', 'Performa Notifikasi', 'bell']];
Pages.laporan = function () {
  var head = P.head('Laporan', 'Pantau progres, keaktifan, dan hasil belajar. Unduh sebagai Excel atau PDF.');
  if (!S.lap) { Sync.muatBerat('lap'); return head + '<div class="card">' + Ui.skel(5, 56) + '</div>'; }
  if (S.lapVer !== S.boot.versi && V.lapReq !== S.boot.versi) { V.lapReq = S.boot.versi; Sync.muatBerat('lap'); }
  V.lp = V.lp || { jenis: 'progres', q: '', kelas: '', status: '', page: 1 };
  var sel = '<div class="g g4 m2 mb" style="grid-template-columns:repeat(5,minmax(0,1fr))">' + LAP.map(function (l) { return '<button class="card tc" style="padding:14px;' + (V.lp.jenis === l[0] ? 'border-color:var(--pri);background:var(--pri-x)' : '') + '" data-act="lapJenis" data-j="' + l[0] + '"><span class="ibox" style="margin:0 auto 8px">' + ico(l[2]) + '</span><div class="b sm">' + l[1] + '</div>' + (l[0] === 'notif' ? '<span class="badge b-amb" style="margin-top:4px">Tahap 2</span>' : '') + '</button>'; }).join('') + '</div>';
  return head + sel + '<div id="lap-body">' + Pages.lapBody() + '</div>';
};
Acts.lapJenis = function (el) { V.lp.jenis = el.dataset.j; V.lp.page = 1; V.lp.q = ''; V.lp.status = ''; Ui.render(); };
Pages.lapData = function () {
  var L = S.lap, f = V.lp, q = f.q.toLowerCase(), j = f.jenis;
  if (j === 'progres') return { head: ['Kelas', 'Peserta', 'Email', 'Jenjang', 'Pertemuan selesai', 'Penyelesaian (%)', 'Tugas terkumpul', 'Rata-rata nilai', 'Aktif terakhir'], rows: L.progres.filter(function (r) { return (!f.kelas || r.kelas_id === f.kelas) && (!q || (r.peserta + ' ' + r.kelas).toLowerCase().indexOf(q) > -1); }).map(function (r) { return [r.kelas, r.peserta, r.email, r.jenjang, r.selesai + '/' + r.total, r.persen, r.tugas_terkumpul + '/' + r.tugas_total, r.rata_nilai == null ? '-' : r.rata_nilai, r.terakhir_aktif ? Wkt.fmt(r.terakhir_aktif) : '-']; }) };
  if (j === 'nilai') return { head: ['Kelas', 'Pertemuan', 'Tugas', 'Peserta', 'Dikirim', 'Status', 'Nilai', 'Versi'], rows: L.nilai.filter(function (r) { return (!f.kelas || r.kelas === (S.boot.kelas.find(function (k) { return k.id === f.kelas; }) || {}).nama) && (!f.status || r.status === f.status) && (!q || (r.peserta + ' ' + r.tugas).toLowerCase().indexOf(q) > -1); }).map(function (r) { return [r.kelas, r.pertemuan, r.tugas, r.peserta, Wkt.fmt(r.waktu), r.status, r.nilai == null ? '-' : Math.round(r.nilai), r.versi]; }) };
  if (j === 'pasif') return { head: ['Peserta', 'Email', 'Aktif terakhir', 'Hari tidak aktif'], rows: L.pasif.filter(function (r) { return !q || r.nama.toLowerCase().indexOf(q) > -1; }).map(function (r) { return [r.nama, r.email, r.terakhir ? Wkt.fmt(r.terakhir) : 'Belum pernah', r.hari > 999 ? 'Belum mulai' : r.hari]; }) };
  return { head: ['Bulan', 'Peserta aktif', 'Peserta baru', 'Total peserta'], rows: L.retensi.map(function (r) { return [r.bulan, r.aktif, r.baru, r.total]; }) };
};
Pages.lapBody = function () {
  var f = V.lp, j = f.jenis, L = S.lap, b = S.boot;
  if (j === 'notif') return '<section class="card"><div class="callout info">' + ico('info', 18) + '<div><b>Performa notifikasi tersedia di tahap 2.</b><br>Laporan keberhasilan kirim WhatsApp dan Email (terkirim, gagal, opt-out) akan muncul di sini setelah modul notifikasi aktif.</div></div></section>';
  var D = Pages.lapData(), pg = Ui.slice(D.rows, f.page, 12), ringkas = '', grafik = '';
  if (j === 'progres') { var rs = L.progres.filter(function (r) { return !f.kelas || r.kelas_id === f.kelas; }), avg = rs.length ? Math.round(rs.reduce(function (s, r) { return s + r.persen; }, 0) / rs.length) : 0, nn = rs.filter(function (r) { return r.rata_nilai != null; }), an = nn.length ? Math.round(nn.reduce(function (s, r) { return s + r.rata_nilai; }, 0) / nn.length) : '-'; ringkas = '<div class="g g3 mb"><div class="card stat"><div class="top2"><span class="ibox">' + ico('users') + '</span><div><div class="mute">Peserta</div><div class="num">' + rs.length + '</div></div></div></div><div class="card stat"><div class="top2"><span class="ibox ok">' + ico('target') + '</span><div><div class="mute">Rata-rata penyelesaian</div><div class="num">' + avg + '%</div></div></div></div><div class="card stat"><div class="top2"><span class="ibox amb">' + ico('star') + '</span><div><div class="mute">Rata-rata nilai</div><div class="num">' + an + '</div></div></div></div></div>'; }
  if (j === 'retensi') grafik = '<section class="card mb"><div class="chead"><span class="ibox">' + ico('chart') + '</span><h2 class="grow">Keaktifan Peserta 12 Bulan Terakhir</h2></div>' + Ui.areaChart({ labels: L.retensi.map(function (r) { return Wkt.blnLabel(r.bulan); }), a: L.retensi.map(function (r) { return r.aktif; }), b: L.retensi.map(function (r) { return r.baru; }), nameA: 'Peserta aktif', nameB: 'Peserta baru', aria: 'Keaktifan dan peserta baru' }) + '<div class="leg mt8"><span><i style="background:#2563eb"></i>Peserta aktif</span><span><i style="background:#f59e0b"></i>Peserta baru</span></div></section>';
  var filt = '<div class="toolbar"><div class="iw grow" style="min-width:160px"><span>' + ico('search', 16) + '</span><input class="inp sm" style="width:100%;padding-left:38px" placeholder="Cari..." value="' + esc(f.q) + '" data-in="lapQ"></div>' +
    ((j === 'progres' || j === 'nilai') ? '<select class="sel sm" data-ch="lapF" data-k="kelas">' + Ui.opt(b.kelas, 'id', 'nama', f.kelas, 'Semua kelas') + '</select>' : '') +
    (j === 'nilai' ? '<select class="sel sm" data-ch="lapF" data-k="status">' + Ui.opt([['terkumpul', 'Terkumpul'], ['terlambat', 'Terlambat'], ['dinilai', 'Dinilai'], ['revisi', 'Revisi']], 0, 1, f.status, 'Semua status') + '</select>' : '') +
    '<button class="btn sec sm" data-act="lapExp" data-f="xlsx">' + ico('download', 14) + ' Excel</button><button class="btn sec sm" data-act="lapExp" data-f="pdf">' + ico('filetext', 14) + ' PDF</button></div>';
  return ringkas + grafik + '<section class="card flush">' + filt + '<div id="lap-tbl">' + Pages.lapTbl(D, pg) + '</div></section>';
};
Pages.lapTbl = function (D, pg) {
  if (!D.rows.length) return Ui.empty('filetext', 'Tidak ada data untuk filter ini.');
  return '<div class="tw"><table class="tbl"><thead><tr>' + D.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + pg.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td>' + (D.head[i] === 'Penyelesaian (%)' ? Ui.progress(c) : D.head[i] === 'Status' ? Ui.badge(c) : esc(c)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + Ui.pager(D.rows.length, V.lp.page, 12, 'lapPg');
};
Acts.lapRefresh = function () { var D = Pages.lapData(); document.getElementById('lap-tbl').innerHTML = Pages.lapTbl(D, Ui.slice(D.rows, V.lp.page, 12)); };
Acts.lapQ = Ui.debounce(function (el) { V.lp.q = el.value; V.lp.page = 1; if (V.lp.jenis === 'progres') Ui.render(); else Acts.lapRefresh(); }, 150);
Acts.lapF = function (el) { V.lp[el.dataset.k] = el.value; V.lp.page = 1; Ui.render(); };
Acts.lapPg = function (el) { V.lp.page = Number(el.dataset.p); Acts.lapRefresh(); };
Acts.lapExp = function (el) {
  var D = Pages.lapData(), nama = (LAP.find(function (l) { return l[0] === V.lp.jenis; }) || [0, 'Laporan'])[1];
  if (el.dataset.f === 'pdf') Ui.cetakPdf('Laporan ' + nama, D.head, D.rows); else Ui.unduhExcel('laporan-' + V.lp.jenis, D.head, D.rows);
};
