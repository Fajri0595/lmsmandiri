/** pages-kelas.js — Kelas, pembuat pertemuan & jalur belajar (drag-and-drop + prasyarat), materi, tugas, peserta kelas, jalur belajar. Untuk admin & pengajar. */
var F = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
K.pool = function () { var b = S.boot; return S.me.role === 'admin' ? b.users.filter(function (u) { return u.role === 'peserta' && u.status === 'aktif'; }) : (b.direktori || []); };
K.pengajarKelas = function (k) { return K.userNama(k.pengajar_id); };
var STATUS_KLS = [['draf', 'Draf'], ['aktif', 'Aktif'], ['akan_datang', 'Akan Datang'], ['selesai', 'Selesai'], ['arsip', 'Arsip']];

/* =================== DAFTAR KELAS =================== */
Pages.kelasList = function () {
  if (S.me.role === 'peserta') return Pages.kelasSaya();
  var b = S.boot; V.kelas = V.kelas || { q: '', jenjang: '', status: '', page: 1 };
  var kanan = '<button class="btn sec" data-act="kelasExp" data-f="xlsx">' + ico('download', 16) + ' Excel</button><button class="btn sec" data-act="kelasExp" data-f="pdf">' + ico('filetext', 16) + ' PDF</button><button class="btn" data-act="kelasForm">' + ico('plus', 16) + ' Tambah Kelas</button>';
  return P.head('Kelas', 'Kelola kelas, pertemuan, dan peserta.', kanan) +
    '<div class="card flush"><div class="toolbar"><div class="iw" style="flex:1;min-width:200px"><span>' + ico('search', 18) + '</span><input class="inp" placeholder="Cari nama kelas atau pengajar" value="' + esc(V.kelas.q) + '" data-in="kelasQ"></div>' +
    '<select class="sel sm" data-ch="kelasF" data-k="jenjang">' + Ui.opt(b.jenjang, 'id', 'nama', V.kelas.jenjang, 'Semua jenjang') + '</select><select class="sel sm" data-ch="kelasF" data-k="status">' + Ui.opt(STATUS_KLS, 0, 1, V.kelas.status, 'Semua status') + '</select></div><div id="kelas-tbl">' + Pages.kelasTbl() + '</div></div>';
};
Pages.kelasFiltered = function () {
  var b = S.boot, f = V.kelas, q = f.q.toLowerCase();
  return b.kelas.filter(function (k) { return k.status !== 'arsip' || f.status === 'arsip'; }).filter(function (k) { return (!f.jenjang || k.jenjang_id === f.jenjang) && (!f.status || k.status === f.status) && (!q || (k.nama + ' ' + K.pengajarKelas(k)).toLowerCase().indexOf(q) > -1); });
};
Pages.kelasTbl = function () {
  var b = S.boot, rows = Pages.kelasFiltered(), pg = Ui.slice(rows, V.kelas.page, 8);
  if (!rows.length) return Ui.empty('school', 'Belum ada kelas yang cocok.', '<div class="mt8"><button class="btn sm" data-act="kelasForm">Tambah kelas</button></div>');
  return '<div class="tw"><table class="tbl"><thead><tr><th>Kelas</th><th class="hide-m">Jenjang</th><th class="hide-m">Pengajar</th><th>Peserta</th><th style="min-width:150px">Penyelesaian</th><th>Status</th><th></th></tr></thead><tbody>' + pg.map(function (k) {
    var r = b.ringkas[k.id] || {};
    return '<tr class="click" data-href="#/kelas/' + esc(k.id) + '"><td><div class="row">' + P.kelasIkon(k) + '<div><div class="b">' + esc(k.nama) + '</div><div class="sm mute">' + (r.pertemuan || 0) + ' pertemuan terbit' + (r.menunggu ? ' · <span style="color:var(--amb-ink)">' + r.menunggu + ' menunggu nilai</span>' : '') + '</div></div></div></td><td class="hide-m">' + esc(K.jenjangNama(k.jenjang_id)) + '</td><td class="hide-m"><div class="row gap8">' + Ui.avatar(K.pengajarKelas(k), 's') + '<span class="trunc">' + esc(K.pengajarKelas(k)) + '</span></div></td><td><b>' + (r.anggota || 0) + '</b></td><td>' + Ui.progress(r.pct || 0) + '</td><td>' + Ui.badge(k.status) + '</td><td class="tr" style="white-space:nowrap"><button class="iconbtn" title="Ubah" data-act="kelasForm" data-id="' + esc(k.id) + '">' + ico('edit', 18) + '</button><button class="iconbtn" title="Duplikat" data-act="kelasForm" data-dup="' + esc(k.id) + '">' + ico('copy', 18) + '</button></td></tr>';
  }).join('') + '</tbody></table></div>' + Ui.pager(rows.length, V.kelas.page, 8, 'kelasPg');
};
Acts.kelasQ = Ui.debounce(function (el) { V.kelas.q = el.value; V.kelas.page = 1; document.getElementById('kelas-tbl').innerHTML = Pages.kelasTbl(); }, 100);
Acts.kelasF = function (el) { V.kelas[el.dataset.k] = el.value; V.kelas.page = 1; document.getElementById('kelas-tbl').innerHTML = Pages.kelasTbl(); };
Acts.kelasPg = function (el) { V.kelas.page = Number(el.dataset.p); document.getElementById('kelas-tbl').innerHTML = Pages.kelasTbl(); };
Acts.kelasExp = function (el) {
  var b = S.boot, rows = Pages.kelasFiltered().map(function (k) { var r = b.ringkas[k.id] || {}; return [k.nama, K.jenjangNama(k.jenjang_id), K.pengajarKelas(k), k.status, r.anggota || 0, r.pertemuan || 0, (r.pct || 0) + '%']; });
  var head = ['Kelas', 'Jenjang', 'Pengajar', 'Status', 'Peserta', 'Pertemuan terbit', 'Penyelesaian'];
  if (el.dataset.f === 'pdf') Ui.cetakPdf('Daftar Kelas', head, rows); else Ui.unduhExcel('daftar-kelas', head, rows);
};

/* =================== FORM KELAS =================== */
Acts.kelasForm = function (el) {
  var b = S.boot, X = K.ix(b), id = el.dataset.id, dup = el.dataset.dup, adm = S.me.role === 'admin';
  var k = id ? X.kelas[id] : (dup ? Object.assign({}, X.kelas[dup], { id: '', nama: X.kelas[dup].nama + ' (Salinan)', status: 'draf' }) : { status: 'draf', warna: 'biru', mulai: Wkt.now().slice(0, 10) });
  var peng = b.users.filter(function (u) { return u.role === 'pengajar' && u.status === 'aktif'; });
  var body = '<div class="fld"><label>Nama kelas *</label><input class="inp" id="kf-nama" value="' + esc(k.nama || '') + '" placeholder="Contoh: Matematika Kelas 4"></div>' +
    '<div class="g g2" style="gap:12px"><div class="fld"><label>Jenjang</label><select class="sel" id="kf-jenjang">' + Ui.opt(b.jenjang, 'id', 'nama', k.jenjang_id, 'Pilih jenjang') + '</select></div>' +
    '<div class="fld"><label>Status</label><select class="sel" id="kf-status">' + Ui.opt(STATUS_KLS, 0, 1, k.status) + '</select></div></div>' +
    (adm ? '<div class="fld"><label>Pengajar *</label><select class="sel" id="kf-pengajar">' + Ui.opt(peng, 'id', 'nama', k.pengajar_id, 'Pilih pengajar') + '</select>' + (peng.length ? '' : '<span class="ferr">Belum ada pengajar. Tambahkan dulu di menu Pengguna.</span>') + '</div>' : '') +
    '<div class="g g2" style="gap:12px"><div class="fld"><label>Jalur belajar</label><select class="sel" id="kf-jalur">' + Ui.opt(b.jalur, 'id', 'nama', k.jalur_id, 'Tanpa jalur') + '</select></div><div class="fld"><label>Tanggal mulai</label><input type="date" class="inp" id="kf-mulai" value="' + esc((k.mulai || '').slice(0, 10)) + '"></div></div>' +
    '<div class="fld"><label>Deskripsi</label><textarea class="txt" id="kf-desk" maxlength="500">' + esc(k.deskripsi || '') + '</textarea></div>' +
    '<div class="fld"><label>Warna ikon</label><div class="chips" id="kf-warna">' + ['biru', 'hijau', 'oranye', 'ungu'].map(function (w) { return '<span class="chip ' + ((k.warna || 'biru') === w ? 'on' : '') + '" data-act="kfWarna" data-w="' + w + '">' + w + '</span>'; }).join('') + '</div></div>' +
    (!id ? '<div class="fld"><label>Salin struktur dari kelas lain (opsional)</label><select class="sel" id="kf-salin">' + Ui.opt(b.kelas, 'id', 'nama', dup || '', 'Mulai kosong') + '</select><span class="hint">Pertemuan, prasyarat, tugas, dan materi berupa tautan ikut disalin sebagai draf.</span></div>' : '');
  Ui.modal({ title: id ? 'Ubah Kelas' : (dup ? 'Duplikat Kelas' : 'Tambah Kelas'), body: body, foot: '<button class="btn sec" data-act="modalX">Batal</button><button class="btn" id="kf-ok" data-act="kelasSimpan" data-id="' + esc(id || '') + '">Simpan</button>' });
};
Acts.kfWarna = function (el) { document.querySelectorAll('#kf-warna .chip').forEach(function (c) { c.classList.toggle('on', c === el); }); };
Acts.kelasSimpan = async function (el) {
  var b = S.boot, adm = S.me.role === 'admin', id = el.dataset.id;
  var w = document.querySelector('#kf-warna .chip.on');
  var data = { id: id || undefined, nama: F('kf-nama').trim(), jenjang_id: F('kf-jenjang'), status: F('kf-status'), pengajar_id: adm ? F('kf-pengajar') : S.me.id, jalur_id: F('kf-jalur'), mulai: F('kf-mulai'), deskripsi: F('kf-desk'), warna: w ? w.dataset.w : 'biru', salin_dari: F('kf-salin') || undefined };
  if (!data.nama) return Ui.toast('Nama kelas wajib diisi.', 'err');
  if (!data.pengajar_id) return Ui.toast('Pilih pengajar kelas.', 'err');
  var r = await K.aksi('kelas.simpan', data, { btn: el, toast: true });
  if (!r) return;
  Ui.closeModal();
  var kl = r.data.kelas || r.data;
  if (id) b.kelas = b.kelas.map(function (x) { return x.id === id ? kl : x; });
  else { b.kelas.push(kl); (r.data.pertemuan || []).forEach(function (p) { b.pertemuan.push(p); }); b.ringkas[kl.id] = { anggota: 0, pertemuan: 0, selesai: 0, pct: 0, menunggu: 0 }; Sync.soon(300); location.hash = '#/kelas/' + kl.id; }
  K.dirty(); K.save(); Ui.render();
};

/* =================== DETAIL KELAS =================== */
Pages.kelasDetail = function (parts) {
  if (S.me.role === 'peserta') return Pages.kelasPeserta(parts);
  var b = S.boot, X = K.ix(b), k = X.kelas[parts[1]];
  if (!k) return P.pesanKosong('Kelas tidak ditemukan atau Anda tidak punya akses.') + '<a class="btn sec mt16" href="#/kelas">' + ico('arrowL', 16) + ' Kembali</a>';
  var tab = parts[2] || 'pertemuan', pts = X.ptByKelas[k.id] || [], r = b.ringkas[k.id] || {};
  var tabs = [['pertemuan', 'Pertemuan', 'video', pts.length], ['materi', 'Materi', 'folder', pts.reduce(function (s, p) { return s + (X.materiByPt[p.id] || []).length; }, 0)], ['tugas', 'Tugas', 'clipboard', pts.reduce(function (s, p) { return s + (X.tugasByPt[p.id] || []).length; }, 0)], ['peserta', 'Peserta', 'users', r.anggota || 0]];
  var head = '<div class="row wrap mb" style="gap:16px;align-items:flex-start"><a class="iconbtn" style="background:#fff;border:1px solid var(--line)" href="#/kelas" aria-label="Kembali">' + ico('arrowL') + '</a><div class="grow"><div class="row gap8 wrap sm"><span class="pill">' + esc(K.jenjangNama(k.jenjang_id)) + '</span>' + Ui.badge(k.status) + '<span class="mute">' + (r.anggota || 0) + ' peserta · pengajar: ' + esc(K.pengajarKelas(k)) + '</span></div><h1 style="margin-top:6px">' + esc(k.nama) + '</h1></div><div class="row gap8 wrap"><button class="btn sec" data-act="kelasForm" data-id="' + esc(k.id) + '">' + ico('edit', 16) + ' Ubah</button><button class="btn" data-act="statusKelas" data-id="' + esc(k.id) + '">' + ico('send', 16) + ' ' + (k.status === 'aktif' ? 'Selesaikan' : 'Aktifkan') + '</button></div></div>';
  var tb = '<div class="mb"><div class="tabs">' + tabs.map(function (t) { return '<a href="#/kelas/' + esc(k.id) + '/' + t[0] + '"><button class="' + (tab === t[0] ? 'on' : '') + '" tabindex="-1">' + ico(t[2], 16) + t[1] + '<span class="cnt">' + t[3] + '</span></button></a>'; }).join('') + '</div></div>';
  var body = tab === 'materi' ? Pages.tabMateri(k) : tab === 'tugas' ? Pages.tabTugas(k) : tab === 'peserta' ? Pages.tabPeserta(k) : Pages.tabPertemuan(k);
  return head + tb + body;
};
Acts.statusKelas = function (el) {
  var k = K.ix(S.boot).kelas[el.dataset.id], baru = k.status === 'aktif' ? 'selesai' : 'aktif', lama = k.status;
  K.aksi('kelas.status', { id: k.id, status: baru }, { opt: function () { k.status = baru; }, undo: function () { k.status = lama; } });
};

/* ---------- tab Pertemuan (builder) ---------- */
Pages.ptCard = function (p, X, i, n, sel) {
  var syarat = (X.syarat[p.id] || []).map(function (id) { var q = X.pt[id]; return q ? 'Pertemuan ' + q.urutan : ''; }).filter(Boolean);
  var cls = p.status === 'selesai' ? 'ok' : p.status === 'draf' ? 'amb' : '';
  return '<div class="mcard' + (sel ? ' sel' : '') + '" draggable="true" data-pid="' + esc(p.id) + '" data-act="selPt" style="' + (sel ? 'border-color:var(--pri)' : '') + '"><span class="mute" style="cursor:grab" title="Seret untuk mengurutkan">' + ico('grip', 20) + '</span><div class="mnum ' + cls + '">' + String(p.urutan).padStart(2, '0') + '</div><div class="grow"><div class="row gap8 wrap"><a class="b" style="font-size:15px" href="#/pertemuan/' + esc(p.id) + '">' + esc(p.judul) + '</a>' + Ui.badge(p.status) + '</div><div class="mmeta"><span>' + ico('calendar', 13) + ' Buka: ' + esc(Wkt.tgl(p.buka)) + '</span><span>' + ico('clock', 13) + ' Tenggat: ' + esc(Wkt.tgl(p.tenggat)) + '</span>' + (syarat.length ? '<span class="badge b-gray">' + ico('lock', 12) + ' Syarat: ' + esc(syarat.join(', ')) + '</span>' : '') + '</div></div><div class="col" style="gap:2px"><button class="iconbtn" style="width:28px;height:22px" data-act="geser" data-id="' + esc(p.id) + '" data-d="-1" ' + (i === 0 ? 'disabled' : '') + ' aria-label="Naikkan">' + ico('up', 16) + '</button><button class="iconbtn" style="width:28px;height:22px" data-act="geser" data-id="' + esc(p.id) + '" data-d="1" ' + (i === n - 1 ? 'disabled' : '') + ' aria-label="Turunkan">' + ico('down', 16) + '</button></div><button class="iconbtn" style="background:var(--soft)" data-act="ptForm" data-id="' + esc(p.id) + '" aria-label="Ubah">' + ico('edit', 18) + '</button></div>';
};
Pages.tabPertemuan = function (k) {
  var b = S.boot, X = K.ix(b), pts = X.ptByKelas[k.id] || [], sel = V.sel && X.pt[V.sel] && X.pt[V.sel].kelas_id === k.id ? V.sel : (pts[0] ? pts[0].id : null);
  var nPub = pts.filter(function (p) { return p.status === 'terbit'; }).length, nDraf = pts.filter(function (p) { return p.status === 'draf'; }).length;
  var kiri = '<div><div class="row sp wrap mb" style="margin-bottom:12px"><div class="row gap8"><h2>Urutan Kurikulum</h2><span class="sm mute hide-m">Seret kartu untuk mengubah urutan</span></div><div class="row gap8"><span class="badge b-ok">' + nPub + ' Terbit</span><span class="badge b-amb">' + nDraf + ' Draf</span></div></div><div class="col" id="pt-list">' + (pts.length ? pts.map(function (p, i) { return Pages.ptCard(p, X, i, pts.length, p.id === sel); }).join('') : '') + '</div><button class="dz dash blk mt16" style="width:100%" data-act="ptForm" data-kelas="' + esc(k.id) + '">' + ico('plus', 16) + ' Tambah Pertemuan</button></div>';
  if (!pts.length) kiri = '<div class="card">' + Ui.empty('video', 'Belum ada pertemuan. Mulai dengan menambahkan pertemuan pertama.', '<div class="mt8"><button class="btn sm" data-act="ptForm" data-kelas="' + esc(k.id) + '">Tambah pertemuan</button></div>') + '</div>';
  var step = pts.map(function (p) {
    var sy = (X.syarat[p.id] || []).map(function (id) { return X.pt[id] ? X.pt[id].urutan : ''; }).join(', ');
    return '<div class="stp ' + (p.status === 'selesai' ? 'done' : p.status === 'terbit' ? 'cur' : '') + '"><div class="dotp">' + (p.status === 'selesai' ? ico('check', 14) : p.status === 'terbit' ? ico('play', 12) : ico('lock', 13)) + '</div><div><div class="t">' + String(p.urutan).padStart(2, '0') + '. ' + esc(p.judul) + '</div><div class="s">' + (p.status === 'draf' ? 'Draf' : p.status === 'selesai' ? 'Selesai' : 'Terbit') + (sy ? ' · Butuh pertemuan ' + esc(sy) : '') + '</div></div></div>';
  }).join('');
  var kanan = '<div class="col" style="gap:20px"><section class="card"><div class="row sp mb" style="margin-bottom:14px"><div><div class="kicker">Ringkasan</div><h2>Jalur Belajar</h2></div><span class="ibox">' + ico('route') + '</span></div><div class="step-wrap">' + (step || '<span class="mute">Belum ada pertemuan.</span>') + '</div></section>' + Pages.panelSyarat(k, X, pts, sel) + '</div>';
  return '<div class="g g75">' + kiri + kanan + '</div>';
};
Pages.panelSyarat = function (k, X, pts, sel) {
  if (!sel) return '';
  var p = X.pt[sel], lain = pts.filter(function (q) { return q.id !== sel; }), cur = X.syarat[sel] || [];
  return '<section class="card"><div class="row sp" style="margin-bottom:10px"><h2>Prasyarat</h2><span class="sm mute">Pertemuan ' + p.urutan + ' dipilih</span></div><p class="sm mute" style="margin-bottom:10px">Peserta harus menyelesaikan pertemuan berikut sebelum membuka “' + esc(p.judul) + '”.</p>' +
    (lain.length ? '<div class="chips">' + lain.map(function (q) { return '<span class="chip ' + (cur.indexOf(q.id) > -1 ? 'on' : '') + '" data-act="togSyarat" data-id="' + esc(q.id) + '">' + (cur.indexOf(q.id) > -1 ? ico('check', 14) : '') + ' ' + q.urutan + '. ' + esc(q.judul.length > 22 ? q.judul.slice(0, 22) + '…' : q.judul) + '</span>'; }).join('') + '</div>' : '<span class="mute sm">Belum ada pertemuan lain.</span>') +
    '<div class="callout mt16">' + ico('alert', 18) + '<div><b>Pencegahan prasyarat melingkar</b><br>Menautkan pertemuan ke pertemuan turunannya otomatis diblokir agar tidak terjadi kunci tanpa ujung.</div></div></section>';
};
Acts.selPt = function (el, e) { if (e.target.closest('a,button')) return; V.sel = el.dataset.pid; Ui.render(); };
Acts.togSyarat = function (el) {
  var b = S.boot, X = K.ix(b), sel = V.sel, q = el.dataset.id, cur = (X.syarat[sel] || []).slice(), ada = cur.indexOf(q) > -1, baru = ada ? cur.filter(function (x) { return x !== q; }) : cur.concat([q]);
  if (!ada && K.butuh(X, q, sel)) return Ui.toast('Ditolak: pertemuan itu sudah bergantung pada pertemuan ini (prasyarat melingkar).', 'err');
  var lama = b.prasyarat.slice();
  K.aksi('pertemuan.prasyarat', { pertemuan_id: sel, prasyarat_ids: baru }, {
    opt: function () { b.prasyarat = b.prasyarat.filter(function (r) { return r.pertemuan_id !== sel; }).concat(baru.map(function (id) { return { id: 'tmp' + id, pertemuan_id: sel, prasyarat_id: id }; })); K.dirty(); },
    undo: function () { b.prasyarat = lama; K.dirty(); }, ok: function (d) { b.prasyarat = b.prasyarat.filter(function (r) { return r.pertemuan_id !== sel; }).concat(d.prasyarat); K.dirty(); }, toast: false
  });
};
Acts.geser = function (el, e) {
  e.stopPropagation(); var b = S.boot, X = K.ix(b), p = X.pt[el.dataset.id], arr = (X.ptByKelas[p.kelas_id] || []).map(function (x) { return x.id; }), i = arr.indexOf(p.id), j = i + Number(el.dataset.d);
  if (j < 0 || j >= arr.length) return; arr.splice(i, 1); arr.splice(j, 0, p.id); Pages.terapkanUrut(p.kelas_id, arr);
};
Pages.terapkanUrut = function (kelasId, ids) {
  var b = S.boot, lama = {}; b.pertemuan.forEach(function (p) { lama[p.id] = p.urutan; });
  K.aksi('pertemuan.urut', { kelas_id: kelasId, ids: ids }, {
    opt: function () { ids.forEach(function (id, i) { var p = b.pertemuan.find(function (x) { return x.id === id; }); if (p) p.urutan = i + 1; }); K.dirty(); },
    undo: function () { b.pertemuan.forEach(function (p) { if (lama[p.id] != null) p.urutan = lama[p.id]; }); K.dirty(); }, toast: false
  });
};
/* Drag & drop (HTML5) */
(function () {
  var drag = null;
  document.addEventListener('dragstart', function (e) { var c = e.target.closest && e.target.closest('.mcard[draggable]'); if (!c) return; drag = c; c.classList.add('drag'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.dataset.pid); } catch (x) { } });
  document.addEventListener('dragover', function (e) { var c = e.target.closest && e.target.closest('.mcard[draggable]'); if (!drag || !c || c === drag) return; e.preventDefault(); document.querySelectorAll('.mcard.over').forEach(function (x) { x.classList.remove('over'); }); c.classList.add('over'); });
  document.addEventListener('dragend', function () { document.querySelectorAll('.mcard.over,.mcard.drag').forEach(function (x) { x.classList.remove('over', 'drag'); }); drag = null; });
  document.addEventListener('drop', function (e) {
    var c = e.target.closest && e.target.closest('.mcard[draggable]'); if (!drag || !c || c === drag) return; e.preventDefault();
    var list = Array.prototype.map.call(document.querySelectorAll('#pt-list .mcard'), function (x) { return x.dataset.pid; }), from = list.indexOf(drag.dataset.pid), to = list.indexOf(c.dataset.pid);
    list.splice(from, 1); list.splice(to, 0, drag.dataset.pid); var kid = K.ix(S.boot).pt[drag.dataset.pid].kelas_id; drag = null; Pages.terapkanUrut(kid, list);
  });
})();

/* ---------- Form pertemuan ---------- */
Acts.ptForm = function (el) {
  var b = S.boot, X = K.ix(b), id = el.dataset.id, p = id ? X.pt[id] : { status: 'draf' }, kid = el.dataset.kelas || (p && p.kelas_id);
  var body = '<div class="fld"><label>Judul pertemuan *</label><input class="inp" id="pf-judul" value="' + esc(p.judul || '') + '" placeholder="Contoh: Mengenal Pecahan"></div><div class="fld"><label>Deskripsi</label><textarea class="txt" id="pf-desk" maxlength="1000">' + esc(p.deskripsi || '') + '</textarea></div>' +
    '<div class="g g2" style="gap:12px"><div class="fld"><label>Tanggal buka</label><input type="datetime-local" class="inp" id="pf-buka" value="' + Wkt.toInp(p.buka) + '"></div><div class="fld"><label>Tenggat</label><input type="datetime-local" class="inp" id="pf-tenggat" value="' + Wkt.toInp(p.tenggat) + '"></div></div>' +
    '<div class="fld"><label>Status</label><select class="sel" id="pf-status"><option value="draf"' + (p.status === 'draf' ? ' selected' : '') + '>Draf (belum terlihat peserta)</option><option value="terbit"' + (p.status === 'terbit' ? ' selected' : '') + '>Terbit</option><option value="selesai"' + (p.status === 'selesai' ? ' selected' : '') + '>Selesai</option></select></div>' +
    (id ? '<div><button class="btn red sm" data-act="ptHapus" data-id="' + esc(id) + '">' + ico('trash', 14) + ' Hapus pertemuan</button></div>' : '');
  Ui.modal({ title: id ? 'Ubah Pertemuan' : 'Tambah Pertemuan', body: body, foot: '<button class="btn sec" data-act="modalX">Batal</button><button class="btn" data-act="ptSimpan" data-id="' + esc(id || '') + '" data-kelas="' + esc(kid) + '">Simpan</button>' });
};
Acts.ptSimpan = async function (el) {
  var id = el.dataset.id, b = S.boot;
  var data = { id: id || undefined, kelas_id: el.dataset.kelas, judul: F('pf-judul').trim(), deskripsi: F('pf-desk'), buka: Wkt.fromInp(F('pf-buka')), tenggat: Wkt.fromInp(F('pf-tenggat')), status: F('pf-status') };
  if (!data.judul) return Ui.toast('Judul wajib diisi.', 'err');
  if (data.buka && data.tenggat && data.tenggat < data.buka) return Ui.toast('Tenggat tidak boleh lebih awal dari tanggal buka.', 'err');
  var r = await K.aksi('pertemuan.simpan', data, { btn: el });
  if (!r) return;
  Ui.closeModal();
  if (id) b.pertemuan = b.pertemuan.map(function (x) { return x.id === id ? r.data : x; }); else { b.pertemuan.push(r.data); V.sel = r.data.id; }
  var rk = b.ringkas[r.data.kelas_id]; if (rk) rk.pertemuan = b.pertemuan.filter(function (x) { return x.kelas_id === r.data.kelas_id && x.status !== 'draf'; }).length;
  K.dirty(); K.save(); Ui.render();
};
Acts.ptHapus = async function (el) {
  var id = el.dataset.id, b = S.boot, X = K.ix(b), p = X.pt[id];
  if (!await Ui.konfirmasi('Hapus pertemuan “' + p.judul + '” beserta materi dan tugasnya? Tindakan ini tidak bisa dibatalkan.', 'Hapus', true)) return;
  var r = await K.aksi('pertemuan.hapus', { id: id }, { toast: false }); if (!r) return;
  b.pertemuan = b.pertemuan.filter(function (x) { return x.id !== id; }); b.materi = b.materi.filter(function (x) { return x.pertemuan_id !== id; }); b.tugas = b.tugas.filter(function (x) { return x.pertemuan_id !== id; });
  b.prasyarat = b.prasyarat.filter(function (x) { return x.pertemuan_id !== id && x.prasyarat_id !== id; });
  Ui.toast('Pertemuan dihapus.', 'ok'); K.dirty(); K.save(); var kid = p.kelas_id; if (location.hash.indexOf('#/pertemuan/') === 0) location.hash = '#/kelas/' + kid; else Ui.render();
};

/* ---------- tab Materi ---------- */
Pages.fileRow = function (m) {
  var ikon = Ui.jenisIkon(m.jenis);
  return '<div class="filechip"><span class="fico">' + ico(ikon, 20) + '</span><div class="grow"><div class="b trunc">' + esc(m.judul) + '</div><div class="sm mute">' + esc(m.jenis) + (m.ukuran ? ' · ' + Ui.ukuran(m.ukuran) : '') + '</div></div>' +
    (m.ada_file ? '<button class="btn soft sm" data-act="ambilFile" data-tipe="materi" data-id="' + esc(m.id) + '">' + ico('download', 14) + ' Unduh</button>' : '<a class="btn soft sm" href="' + esc(m.url) + '" target="_blank" rel="noopener noreferrer">' + ico('link', 14) + ' Buka</a>') +
    (S.me.role !== 'peserta' && S.me.role !== 'ortu' ? '<button class="iconbtn" data-act="materiHapus" data-id="' + esc(m.id) + '" aria-label="Hapus">' + ico('trash', 18) + '</button>' : '') + '</div>';
};
Pages.tabMateri = function (k) {
  var X = K.ix(S.boot), pts = X.ptByKelas[k.id] || [];
  if (!pts.length) return P.pesanKosong('Tambahkan pertemuan lebih dulu, lalu unggah materinya.');
  return '<div class="col" style="gap:16px">' + pts.map(function (p) {
    var ms = X.materiByPt[p.id] || [];
    return '<section class="card"><div class="row sp wrap" style="margin-bottom:12px"><div class="row gap8"><div class="mnum" style="width:36px;height:36px;font-size:13px">' + String(p.urutan).padStart(2, '0') + '</div><h3>' + esc(p.judul) + '</h3></div><button class="btn soft sm" data-act="materiForm" data-pt="' + esc(p.id) + '">' + ico('plus', 14) + ' Tambah materi</button></div>' + (ms.length ? '<div class="col" style="gap:8px">' + ms.map(Pages.fileRow).join('') + '</div>' : '<span class="mute sm">Belum ada materi.</span>') + '</section>';
  }).join('') + '</div>';
};
Acts.materiForm = function (el) {
  var maks = Number(K.app().MAKS_MB_BAWAAN) || 10;
  var body = '<div class="tabs" style="align-self:flex-start"><button class="on" data-act="mfTab" data-t="file">Unggah file</button><button data-act="mfTab" data-t="link">Tautan</button></div><div class="fld"><label>Judul materi *</label><input class="inp" id="mf-judul" placeholder="Contoh: Modul Pecahan (PDF)"></div>' +
    '<div id="mf-file"><div class="dz" data-act="mfPilih"><input type="file" id="mf-input" hidden data-ch="mfFile">' + ico('upload', 26) + '<div class="b" style="margin-top:6px" id="mf-nama">Klik untuk memilih file</div><div class="hint">PDF, dokumen, slide, lembar kerja, audio, gambar, kode (maks ' + maks + ' MB)</div></div></div>' +
    '<div id="mf-link" hidden class="fld"><label>Tautan (Drive, YouTube, dll.) *</label><input class="inp" id="mf-url" placeholder="https://"><span class="hint">Untuk video atau file besar, gunakan tautan.</span></div>';
  Ui.modal({ title: 'Tambah Materi', body: body, foot: '<button class="btn sec" data-act="modalX">Batal</button><button class="btn" data-act="materiSimpan" data-pt="' + esc(el.dataset.pt) + '">Simpan</button>' });
  V.mfMode = 'file'; V.mfFile = null;
};
Acts.mfTab = function (el) { V.mfMode = el.dataset.t; el.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === el); }); document.getElementById('mf-file').hidden = V.mfMode !== 'file'; document.getElementById('mf-link').hidden = V.mfMode !== 'link'; };
Acts.mfPilih = function () { document.getElementById('mf-input').click(); };
Acts.mfFile = function (el) { var f = el.files[0]; if (!f) return; var maks = (Number(K.app().MAKS_MB_BAWAAN) || 10) * 1048576; if (f.size > maks) { el.value = ''; return Ui.toast('File terlalu besar. Maksimal ' + Math.round(maks / 1048576) + ' MB — gunakan tautan untuk file besar.', 'err'); } V.mfFile = f; document.getElementById('mf-nama').textContent = f.name + ' (' + Ui.ukuran(f.size) + ')'; if (!F('mf-judul')) document.getElementById('mf-judul').value = f.name.replace(/\.[^.]+$/, ''); };
Acts.materiSimpan = async function (el) {
  var data = { pertemuan_id: el.dataset.pt, judul: F('mf-judul').trim() };
  if (!data.judul) return Ui.toast('Judul materi wajib diisi.', 'err');
  if (V.mfMode === 'link') { data.url = F('mf-url').trim(); if (!/^https?:\/\//i.test(data.url)) return Ui.toast('Tautan harus diawali http:// atau https://', 'err'); }
  else { if (!V.mfFile) return Ui.toast('Pilih file atau gunakan tab Tautan.', 'err'); data.nama_file = V.mfFile.name; data.mime = V.mfFile.type; data.base64 = await Ui.bacaFile(V.mfFile); }
  var r = await K.aksi('materi.simpan', data, { btn: el, label: 'Mengunggah...' }); if (!r) return;
  Ui.closeModal(); S.boot.materi.push(r.data); K.dirty(); K.save(); Ui.render();
};
Acts.materiHapus = async function (el) {
  var id = el.dataset.id, b = S.boot, m = b.materi.find(function (x) { return x.id === id; });
  if (!await Ui.konfirmasi('Hapus materi “' + m.judul + '”?', 'Hapus', true)) return;
  var lama = b.materi.slice();
  K.aksi('materi.hapus', { id: id }, { opt: function () { b.materi = b.materi.filter(function (x) { return x.id !== id; }); K.dirty(); }, undo: function () { b.materi = lama; K.dirty(); } });
};
Acts.ambilFile = async function (el) {
  Ui.sibuk(el, true, 'Menyiapkan...');
  var r = await Api.call('file.ambil', { tipe: el.dataset.tipe, id: el.dataset.id });
  Ui.sibuk(el, false);
  if (!r.success) return Ui.toast(r.message || 'Gagal mengunduh file.', 'err');
  Ui.unduhBase64(r.data.nama, r.data.mime, r.data.base64);
};

/* ---------- tab Tugas ---------- */
Pages.tabTugas = function (k) {
  var X = K.ix(S.boot), pts = X.ptByKelas[k.id] || [];
  if (!pts.length) return P.pesanKosong('Tambahkan pertemuan lebih dulu, lalu buat tugasnya.');
  return '<div class="col" style="gap:16px">' + pts.map(function (p) {
    var ts = X.tugasByPt[p.id] || [];
    return '<section class="card"><div class="row sp wrap" style="margin-bottom:12px"><div class="row gap8"><div class="mnum" style="width:36px;height:36px;font-size:13px">' + String(p.urutan).padStart(2, '0') + '</div><h3>' + esc(p.judul) + '</h3></div><button class="btn soft sm" data-act="tugasForm" data-pt="' + esc(p.id) + '">' + ico('plus', 14) + ' Tambah tugas</button></div>' + (ts.length ? '<div class="col" style="gap:8px">' + ts.map(function (t) { return '<div class="filechip"><span class="fico">' + ico('clipboard', 20) + '</span><div class="grow"><div class="b trunc">' + esc(t.judul) + '</div><div class="sm mute">Tenggat ' + esc(Wkt.fmt(t.tenggat)) + ' · ' + esc((t.format || '').toUpperCase().replace(/,/g, ', ')) + ' · maks ' + t.maks_mb + ' MB</div></div><button class="iconbtn" data-act="tugasForm" data-id="' + esc(t.id) + '" aria-label="Ubah">' + ico('edit', 18) + '</button></div>'; }).join('') + '</div>' : '<span class="mute sm">Belum ada tugas.</span>') + '</section>';
  }).join('') + '</div>';
};
var FMT_PILIHAN = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'txt', 'jpg', 'png', 'mp3', 'mp4', 'zip', 'js', 'py', 'html'];
Acts.tugasForm = function (el) {
  var b = S.boot, X = K.ix(b), id = el.dataset.id, t = id ? X.tugas[id] : { format: K.app().FORMAT_BAWAAN || 'pdf,docx,jpg,png', maks_mb: Number(K.app().MAKS_MB_BAWAAN) || 10 }, pt = id ? t.pertemuan_id : el.dataset.pt, sel = String(t.format || '').split(',');
  var body = '<div class="fld"><label>Judul tugas *</label><input class="inp" id="tf-judul" value="' + esc(t.judul || '') + '"></div><div class="fld"><label>Instruksi</label><textarea class="txt" id="tf-ins" maxlength="2000">' + esc(t.instruksi || '') + '</textarea></div>' +
    '<div class="fld"><label>Format file yang diizinkan</label><div class="chips" id="tf-fmt">' + FMT_PILIHAN.map(function (f) { return '<span class="chip ' + (sel.indexOf(f) > -1 ? 'on' : '') + '" data-act="tfFmt">' + f + '</span>'; }).join('') + '</div></div>' +
    '<div class="g g2" style="gap:12px"><div class="fld"><label>Batas ukuran (MB)</label><input type="number" min="1" max="10" class="inp" id="tf-mb" value="' + esc(t.maks_mb) + '"><span class="hint">Maksimal 10 MB. File lebih besar dikumpulkan lewat tautan.</span></div><div class="fld"><label>Tenggat</label><input type="datetime-local" class="inp" id="tf-tenggat" value="' + Wkt.toInp(t.tenggat) + '"></div></div>' +
    (id ? '<div><button class="btn red sm" data-act="tugasHapus" data-id="' + esc(id) + '">' + ico('trash', 14) + ' Hapus tugas</button></div>' : '');
  Ui.modal({ title: id ? 'Ubah Tugas' : 'Buat Tugas', body: body, foot: '<button class="btn sec" data-act="modalX">Batal</button><button class="btn" data-act="tugasSimpan" data-id="' + esc(id || '') + '" data-pt="' + esc(pt) + '">Simpan</button>' });
};
Acts.tfFmt = function (el) { el.classList.toggle('on'); };
Acts.tugasSimpan = async function (el) {
  var id = el.dataset.id, b = S.boot, fmt = Array.prototype.map.call(document.querySelectorAll('#tf-fmt .chip.on'), function (c) { return c.textContent; }).join(',');
  var data = { id: id || undefined, pertemuan_id: el.dataset.pt, judul: F('tf-judul').trim(), instruksi: F('tf-ins'), format: fmt, maks_mb: Number(F('tf-mb')) || 10, tenggat: Wkt.fromInp(F('tf-tenggat')) };
  if (!data.judul) return Ui.toast('Judul tugas wajib diisi.', 'err');
  if (!fmt) return Ui.toast('Pilih minimal satu format file.', 'err');
  var r = await K.aksi('tugas.simpan', data, { btn: el }); if (!r) return;
  Ui.closeModal(); if (id) b.tugas = b.tugas.map(function (x) { return x.id === id ? r.data : x; }); else b.tugas.push(r.data); K.dirty(); K.save(); Ui.render();
};
Acts.tugasHapus = async function (el) {
  var id = el.dataset.id, b = S.boot; if (!await Ui.konfirmasi('Hapus tugas ini?', 'Hapus', true)) return;
  var r = await K.aksi('tugas.hapus', { id: id }, { toast: false }); if (!r) return; Ui.closeModal(); b.tugas = b.tugas.filter(function (x) { return x.id !== id; }); K.dirty(); K.save(); Ui.render(); Ui.toast('Tugas dihapus.', 'ok');
};

/* ---------- tab Peserta ---------- */
Pages.tabPeserta = function (k) {
  var b = S.boot, X = K.ix(b), ids = X.angByKelas[k.id] || [];
  var lap = {}; if (S.lap) S.lap.progres.forEach(function (r) { if (r.kelas_id === k.id) lap[r.peserta_id] = r; });
  if (!S.lap) Sync.muatBerat('lap');
  var rows = ids.map(function (id) { var u = X.users[id] || (b.direktori || []).find(function (d) { return d.id === id; }) || { id: id, nama: '(tidak dikenal)' }; return u; });
  return '<div class="card flush"><div class="toolbar"><h3 class="grow">Peserta kelas (' + ids.length + ')</h3><button class="btn" data-act="anggotaForm" data-id="' + esc(k.id) + '">' + ico('plus', 16) + ' Tambah peserta</button></div>' +
    (rows.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Peserta</th><th class="hide-m">Jenjang</th><th style="min-width:150px">Penyelesaian</th><th class="hide-m">Tugas</th><th class="hide-m">Aktif terakhir</th><th></th></tr></thead><tbody>' + rows.map(function (u) {
      var r = lap[u.id];
      return '<tr><td><div class="row">' + Ui.avatar(u.nama, 's') + '<div><div class="b">' + esc(u.nama) + '</div><div class="sm mute">' + esc(u.email || '') + '</div></div></div></td><td class="hide-m">' + esc(K.jenjangNama(u.jenjang_id)) + '</td><td>' + (r ? Ui.progress(r.persen) : '<span class="skel" style="display:inline-block;width:90px;height:10px"></span>') + '</td><td class="hide-m">' + (r ? r.tugas_terkumpul + '/' + r.tugas_total : '-') + '</td><td class="hide-m sm mute">' + (r ? esc(Wkt.rel(r.terakhir_aktif)) : '-') + '</td><td class="tr"><button class="iconbtn" title="Keluarkan dari kelas" data-act="anggotaHapus" data-k="' + esc(k.id) + '" data-id="' + esc(u.id) + '">' + ico('x', 18) + '</button></td></tr>';
    }).join('') + '</tbody></table></div>' : Ui.empty('users', 'Belum ada peserta di kelas ini.', '<div class="mt8"><button class="btn sm" data-act="anggotaForm" data-id="' + esc(k.id) + '">Tambah peserta</button></div>')) + '</div>';
};
Acts.anggotaForm = function (el) {
  var kid = el.dataset.id, X = K.ix(S.boot), sudah = X.angByKelas[kid] || [], pool = K.pool().filter(function (u) { return sudah.indexOf(u.id) < 0; });
  V.ang = { kid: kid, pool: pool, q: '', pilih: {} };
  Ui.modal({ title: 'Tambah Peserta ke Kelas', size: 'lg', body: '<div class="iw"><span>' + ico('search', 18) + '</span><input class="inp" id="ag-q" placeholder="Cari nama peserta" data-in="agQ"></div><div id="ag-list" style="max-height:46vh;overflow:auto">' + Pages.agList() + '</div>', foot: '<span class="grow mute sm" id="ag-n">0 dipilih</span><button class="btn sec" data-act="modalX">Batal</button><button class="btn" data-act="anggotaSimpan">Tambahkan</button>' });
};
Pages.agList = function () {
  var a = V.ang, q = a.q.toLowerCase(), l = a.pool.filter(function (u) { return !q || (u.nama + ' ' + (u.email || '')).toLowerCase().indexOf(q) > -1; }).slice(0, 80);
  return l.length ? l.map(function (u) { return '<label class="lrow click" style="cursor:pointer"><input type="checkbox" class="chk" style="width:18px;height:18px;accent-color:var(--pri)" data-ch="agPilih" data-id="' + esc(u.id) + '"' + (a.pilih[u.id] ? ' checked' : '') + '>' + Ui.avatar(u.nama, 's') + '<div class="grow"><div class="t">' + esc(u.nama) + '</div><div class="s">' + esc(K.jenjangNama(u.jenjang_id)) + '</div></div></label>'; }).join('') : Ui.empty('users', 'Tidak ada peserta yang bisa ditambahkan.');
};
Acts.agQ = Ui.debounce(function (el) { V.ang.q = el.value; document.getElementById('ag-list').innerHTML = Pages.agList(); }, 100);
Acts.agPilih = function (el) { if (el.checked) V.ang.pilih[el.dataset.id] = 1; else delete V.ang.pilih[el.dataset.id]; document.getElementById('ag-n').textContent = Object.keys(V.ang.pilih).length + ' dipilih'; };
Acts.anggotaSimpan = async function (el) {
  var a = V.ang, ids = Object.keys(a.pilih), b = S.boot; if (!ids.length) return Ui.toast('Pilih minimal satu peserta.', 'err');
  var r = await K.aksi('kelas.anggota', { kelas_id: a.kid, tambah: ids }, { btn: el }); if (!r) return;
  Ui.closeModal(); b.keanggotaan = b.keanggotaan.filter(function (x) { return x.kelas_id !== a.kid; }).concat(r.data.anggota);
  if (b.ringkas[a.kid]) b.ringkas[a.kid].anggota = r.data.anggota.length; K.dirty(); K.save(); Ui.render();
};
Acts.anggotaHapus = async function (el) {
  var kid = el.dataset.k, pid = el.dataset.id, b = S.boot; if (!await Ui.konfirmasi('Keluarkan peserta ini dari kelas? Riwayat tugasnya tetap tersimpan.', 'Keluarkan', true)) return;
  var lama = b.keanggotaan.slice();
  K.aksi('kelas.anggota', { kelas_id: kid, hapus: [pid] }, { opt: function () { b.keanggotaan = b.keanggotaan.filter(function (x) { return !(x.kelas_id === kid && x.peserta_id === pid); }); if (b.ringkas[kid]) b.ringkas[kid].anggota--; K.dirty(); }, undo: function () { b.keanggotaan = lama; if (b.ringkas[kid]) b.ringkas[kid].anggota++; K.dirty(); } });
};

/* =================== DETAIL PERTEMUAN (STAF) =================== */
Pages.pertemuanDetail = function (parts) {
  if (S.me.role === 'peserta' || S.me.role === 'ortu') return Pages.ruang(parts);
  var b = S.boot, X = K.ix(b), p = X.pt[parts[1]];
  if (!p) return P.pesanKosong('Pertemuan tidak ditemukan.') + '<a class="btn sec mt16" href="#/pertemuan">' + ico('arrowL', 16) + ' Kembali</a>';
  var k = X.kelas[p.kelas_id], ms = X.materiByPt[p.id] || [], ts = X.tugasByPt[p.id] || [], pts = X.ptByKelas[k.id] || [];
  var head = '<div class="row wrap mb" style="gap:16px;align-items:flex-start"><a class="iconbtn" style="background:#fff;border:1px solid var(--line)" href="#/kelas/' + esc(k.id) + '" aria-label="Kembali">' + ico('arrowL') + '</a><div class="grow"><div class="row gap8 wrap sm"><span class="pill">' + esc(k.nama) + '</span>' + Ui.badge(p.status) + '</div><h1 style="margin-top:6px">Pertemuan ' + p.urutan + ': ' + esc(p.judul) + '</h1><div class="mmeta" style="font-size:13px"><span>' + ico('calendar', 14) + ' Buka: ' + esc(Wkt.fmt(p.buka)) + '</span><span>' + ico('clock', 14) + ' Tenggat: ' + esc(Wkt.fmt(p.tenggat)) + '</span></div></div><button class="btn sec" data-act="ptForm" data-id="' + esc(p.id) + '">' + ico('edit', 16) + ' Ubah pertemuan</button></div>';
  var desk = p.deskripsi ? '<section class="card mb"><h3 style="margin-bottom:6px">Deskripsi</h3><p class="ink2">' + esc(p.deskripsi) + '</p></section>' : '';
  var mat = '<section class="card"><div class="chead"><span class="ibox">' + ico('folder') + '</span><h2 class="grow">Materi (' + ms.length + ')</h2><button class="btn soft sm" data-act="materiForm" data-pt="' + esc(p.id) + '">' + ico('plus', 14) + ' Tambah</button></div>' + (ms.length ? '<div class="col" style="gap:8px">' + ms.map(Pages.fileRow).join('') + '</div>' : Ui.empty('folder', 'Belum ada materi.')) + '</section>';
  var tug = '<section class="card"><div class="chead"><span class="ibox amb">' + ico('clipboard') + '</span><h2 class="grow">Tugas (' + ts.length + ')</h2><button class="btn soft sm" data-act="tugasForm" data-pt="' + esc(p.id) + '">' + ico('plus', 14) + ' Tambah</button></div>' + (ts.length ? '<div class="col" style="gap:8px">' + ts.map(function (t) { return '<div class="filechip"><span class="fico">' + ico('clipboard', 20) + '</span><div class="grow"><div class="b trunc">' + esc(t.judul) + '</div><div class="sm mute">Tenggat ' + esc(Wkt.fmt(t.tenggat)) + ' · ' + esc((t.format || '').toUpperCase().replace(/,/g, ', ')) + ' · maks ' + t.maks_mb + ' MB</div></div><button class="iconbtn" data-act="tugasForm" data-id="' + esc(t.id) + '">' + ico('edit', 18) + '</button></div>'; }).join('') + '</div>' : Ui.empty('clipboard', 'Belum ada tugas.')) + '</section>';
  V.sel = p.id;
  return head + desk + '<div class="g g75"><div class="col" style="gap:20px">' + mat + tug + '</div>' + Pages.panelSyarat(k, X, pts, p.id) + '</div>';
};

/* =================== PERTEMUAN & MATERI (DAFTAR) =================== */
Pages.pertemuanList = function () {
  if (S.me.role === 'peserta' || S.me.role === 'ortu') { location.hash = '#/'; return ''; }
  var b = S.boot, X = K.ix(b); V.ptl = V.ptl || { kelas: '' };
  var kls = b.kelas.filter(function (k) { return !V.ptl.kelas || k.id === V.ptl.kelas; });
  return P.head('Pertemuan & Materi', 'Seluruh pertemuan, materi, dan tugas dari semua kelas Anda.', '<select class="sel" data-ch="ptlKelas" style="min-width:220px">' + Ui.opt(b.kelas, 'id', 'nama', V.ptl.kelas, 'Semua kelas') + '</select>') +
    (kls.length ? kls.map(function (k) {
      var pts = X.ptByKelas[k.id] || [];
      return '<section class="card flush mb"><div class="toolbar">' + P.kelasIkon(k) + '<h3 class="grow">' + esc(k.nama) + '</h3>' + Ui.badge(k.status) + '<a class="btn soft sm" href="#/kelas/' + esc(k.id) + '">Buka kelas</a></div>' + (pts.length ? '<div class="tw"><table class="tbl"><thead><tr><th>#</th><th>Pertemuan</th><th>Status</th><th class="hide-m">Buka</th><th class="hide-m">Tenggat</th><th>Materi</th><th>Tugas</th></tr></thead><tbody>' + pts.map(function (p) { return '<tr class="click" data-href="#/pertemuan/' + esc(p.id) + '"><td><b>' + String(p.urutan).padStart(2, '0') + '</b></td><td class="b">' + esc(p.judul) + '</td><td>' + Ui.badge(p.status) + '</td><td class="hide-m">' + esc(Wkt.tgl(p.buka)) + '</td><td class="hide-m">' + esc(Wkt.tgl(p.tenggat)) + '</td><td>' + (X.materiByPt[p.id] || []).length + '</td><td>' + (X.tugasByPt[p.id] || []).length + '</td></tr>'; }).join('') + '</tbody></table></div>' : Ui.empty('video', 'Belum ada pertemuan.')) + '</section>';
    }).join('') : P.pesanKosong('Belum ada kelas.'));
};
Acts.ptlKelas = function (el) { V.ptl.kelas = el.value; Ui.render(); };

/* =================== JALUR BELAJAR =================== */
Pages.jalurList = function () {
  if (S.me.role === 'peserta' || S.me.role === 'ortu') { location.hash = '#/'; return ''; }
  var b = S.boot, X = K.ix(b);
  return P.head('Jalur Belajar', 'Rancang tujuan dan arah belajar yang dipakai kelas.', '<button class="btn" data-act="jalurForm">' + ico('plus', 16) + ' Tambah Jalur</button>') +
    (b.jalur.length ? '<div class="g g3">' + b.jalur.map(function (j) {
      var pakai = b.kelas.filter(function (k) { return k.jalur_id === j.id; });
      return '<section class="card"><div class="row sp" style="margin-bottom:10px"><span class="ibox">' + ico('route') + '</span><div class="row gap8"><button class="iconbtn" data-act="jalurForm" data-id="' + esc(j.id) + '" aria-label="Ubah">' + ico('edit', 18) + '</button>' + (S.me.role === 'admin' ? '<button class="iconbtn" data-act="jalurHapus" data-id="' + esc(j.id) + '" aria-label="Hapus">' + ico('trash', 18) + '</button>' : '') + '</div></div><h3>' + esc(j.nama) + '</h3><div class="sm mute" style="margin:2px 0 8px">' + esc(K.jenjangNama(j.jenjang_id)) + '</div><p class="ink2 sm" style="min-height:40px">' + esc(j.tujuan || 'Belum ada tujuan belajar.') + '</p><div class="mt16 sm"><b>' + pakai.length + '</b> kelas memakai jalur ini' + (pakai.length ? ':<div class="chips mt8">' + pakai.slice(0, 3).map(function (k) { return '<a class="pill" href="#/kelas/' + esc(k.id) + '">' + esc(k.nama.length > 20 ? k.nama.slice(0, 20) + '…' : k.nama) + '</a>'; }).join('') + '</div>' : '') + '</div></section>';
    }).join('') + '</div>' : P.pesanKosong('Belum ada jalur belajar. Buat jalur pertama Anda.'));
};
Acts.jalurForm = function (el) {
  var b = S.boot, id = el.dataset.id, j = id ? b.jalur.find(function (x) { return x.id === id; }) : {};
  Ui.modal({ title: id ? 'Ubah Jalur Belajar' : 'Tambah Jalur Belajar', body: '<div class="fld"><label>Nama jalur *</label><input class="inp" id="jf-nama" value="' + esc(j.nama || '') + '" placeholder="Contoh: Dasar Matematika SD"></div><div class="fld"><label>Jenjang</label><select class="sel" id="jf-jenjang">' + Ui.opt(b.jenjang, 'id', 'nama', j.jenjang_id, 'Semua jenjang') + '</select></div><div class="fld"><label>Tujuan belajar</label><textarea class="txt" id="jf-tujuan" maxlength="300">' + esc(j.tujuan || '') + '</textarea></div><div class="fld"><label>Deskripsi</label><textarea class="txt" id="jf-desk" maxlength="1000">' + esc(j.deskripsi || '') + '</textarea></div>', foot: '<button class="btn sec" data-act="modalX">Batal</button><button class="btn" data-act="jalurSimpan" data-id="' + esc(id || '') + '">Simpan</button>' });
};
Acts.jalurSimpan = async function (el) {
  var id = el.dataset.id, b = S.boot, data = { id: id || undefined, nama: F('jf-nama').trim(), jenjang_id: F('jf-jenjang'), tujuan: F('jf-tujuan'), deskripsi: F('jf-desk') };
  if (!data.nama) return Ui.toast('Nama jalur wajib diisi.', 'err');
  var r = await K.aksi('jalur.simpan', data, { btn: el }); if (!r) return;
  Ui.closeModal(); if (id) b.jalur = b.jalur.map(function (x) { return x.id === id ? r.data : x; }); else b.jalur.push(r.data); K.dirty(); K.save(); Ui.render();
};
Acts.jalurHapus = async function (el) {
  var id = el.dataset.id, b = S.boot; if (!await Ui.konfirmasi('Hapus jalur belajar ini?', 'Hapus', true)) return;
  var lama = b.jalur.slice(); K.aksi('jalur.hapus', { id: id }, { opt: function () { b.jalur = b.jalur.filter(function (x) { return x.id !== id; }); }, undo: function () { b.jalur = lama; } });
};
