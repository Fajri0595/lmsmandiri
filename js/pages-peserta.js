/** pages-peserta.js — Sisi peserta (dan orang tua, hanya baca): Kelas Saya, peta jalur, Ruang Pertemuan, unggah tugas, Tugas & Nilai. */

Pages.kelasSaya = function () {
  var d = K.D(), sd = K.sd();
  if (!d.kelas.length) return P.head(sd ? 'Kelasku' : 'Kelas Saya') + P.pesanKosong('Kamu belum terdaftar di kelas mana pun.');
  return P.head(sd ? 'Kelasku' : 'Kelas Saya', 'Pilih kelas untuk melihat jalur belajar.') + '<div class="g g3">' + d.kelas.map(function (k) {
    var pk = K.progKelas(d, k.id);
    return '<a class="card" href="#/kelas/' + esc(k.id) + '" style="display:block"><div class="row sp" style="margin-bottom:12px">' + P.kelasIkon(k) + Ui.badge(k.status) + '</div><h3>' + esc(k.nama) + '</h3><div class="sm mute" style="margin:2px 0 12px">Pengajar: ' + esc(k.pengajar_nama || '-') + '</div>' + Ui.progress(pk.pct) + '<div class="sm mute mt8">' + pk.selesai + ' dari ' + pk.total + ' pertemuan selesai</div>' + (pk.next ? '<div class="callout info mt16" style="padding:10px 12px">' + ico('play', 16) + '<div class="sm"><b>Berikutnya:</b> ' + esc(pk.next.judul) + '</div></div>' : '') + '</a>';
  }).join('') + '</div>';
};

Pages.kelasPeserta = function (parts) {
  var d = K.D(), X = K.ix(d), k = X.kelas[parts[1]];
  if (!k) return P.pesanKosong('Kelas tidak ditemukan.') + '<a class="btn sec mt16" href="#/kelas">' + ico('arrowL', 16) + ' Kembali</a>';
  var pk = K.progKelas(d, k.id), sd = K.sd();
  var daftar = pk.nodes.map(function (n) {
    var kunci = n.st === 'terkunci' || n.st === 'belum_buka';
    var syarat = (X.syarat[n.p.id] || []).map(function (id) { return X.pt[id] ? X.pt[id].urutan : ''; }).join(', ');
    return '<' + (kunci ? 'div' : 'a href="#/ruang/' + esc(n.p.id) + '"') + ' class="mcard" style="' + (kunci ? 'opacity:.75' : 'cursor:pointer') + '"><div class="mnum ' + (n.st === 'selesai' ? 'ok' : n.st === 'dibuka' ? 'cur' : '') + '">' + String(n.p.urutan).padStart(2, '0') + '</div><div class="grow"><div class="b" style="font-size:15px">' + esc(n.p.judul) + '</div><div class="mmeta"><span>' + ico('calendar', 13) + ' Buka ' + esc(Wkt.tgl(n.p.buka)) + '</span><span>' + ico('clock', 13) + ' Tenggat ' + esc(Wkt.tgl(n.p.tenggat)) + '</span>' + (n.st === 'terkunci' ? '<span>' + ico('lock', 13) + ' Selesaikan pertemuan ' + esc(syarat) + ' dulu</span>' : '') + '</div></div>' + Ui.badge(n.st) + (kunci ? '' : ico('chevR', 18)) + '</' + (kunci ? 'div' : 'a') + '>';
  }).join('');
  return '<div class="row wrap mb" style="gap:16px"><a class="iconbtn" style="background:#fff;border:1px solid var(--line)" href="#/kelas" aria-label="Kembali">' + ico('arrowL') + '</a><div class="grow"><div class="sm mute">Pengajar: ' + esc(k.pengajar_nama || '-') + '</div><h1>' + esc(k.nama) + '</h1></div><div style="min-width:180px">' + Ui.progress(pk.pct) + '</div></div>' +
    '<section class="card mb"><div class="mb"><div class="kicker">Jalur belajar</div><h2>' + (sd ? 'Peta Belajarku' : 'Peta Jalur Belajar') + '</h2></div>' + Pages.petaJalur(d, pk) + '</section><div class="col">' + (daftar || Ui.empty('video', 'Belum ada pertemuan terbit.')) + '</div>';
};

/* =================== RUANG PERTEMUAN =================== */
Pages.ruang = function (parts) {
  var d = K.D(), X = K.ix(d), p = X.pt[parts[1]], sd = K.sd(), ro = S.me.role !== 'peserta';
  if (!p) return P.pesanKosong('Pertemuan tidak ditemukan atau belum tersedia.') + '<a class="btn sec mt16" href="#/kelas">' + ico('arrowL', 16) + ' Kembali</a>';
  var k = X.kelas[p.kelas_id], st = K.akses(d, p), back = '<a class="iconbtn" style="background:#fff;border:1px solid var(--line)" href="#/kelas/' + esc(k.id) + '" aria-label="Kembali">' + ico('arrowL') + '</a>';
  if (st === 'terkunci') {
    var perlu = (X.syarat[p.id] || []).map(function (id) { return X.pt[id]; }).filter(function (q) { return q && K.akses(d, q) !== 'selesai'; });
    return '<div class="row mb">' + back + '<h1>Pertemuan ' + p.urutan + ': ' + esc(p.judul) + '</h1></div><section class="card tc" style="padding:40px 20px"><span class="ibox" style="margin:0 auto 12px;width:56px;height:56px">' + ico('lock', 28) + '</span><h2>Pertemuan ini masih terkunci</h2><p class="mute" style="margin:8px 0 16px">Selesaikan dulu pertemuan berikut:</p><div class="chips" style="justify-content:center">' + perlu.map(function (q) { return '<a class="pill" href="#/ruang/' + esc(q.id) + '">' + q.urutan + '. ' + esc(q.judul) + '</a>'; }).join('') + '</div></section>';
  }
  if (st === 'belum_buka') return '<div class="row mb">' + back + '<h1>Pertemuan ' + p.urutan + ': ' + esc(p.judul) + '</h1></div><section class="card tc" style="padding:40px 20px"><span class="ibox" style="margin:0 auto 12px;width:56px;height:56px">' + ico('clock', 28) + '</span><h2>Belum dibuka</h2><p class="mute" style="margin-top:8px">Pertemuan ini dibuka pada <b>' + esc(Wkt.fmt(p.buka)) + '</b>.</p></section>';
  if (!ro && !X.prog[p.id] && !V.dibuka[p.id]) { V.dibuka[p.id] = 1; Pages.catatBuka(p); }
  var ms = X.materiByPt[p.id] || [], ts = X.tugasByPt[p.id] || [];
  var semuaKumpul = ts.every(function (t) { return K.kmpTerakhir(d, t.id); }), selesai = st === 'selesai';
  var head = '<div class="row wrap mb" style="gap:16px;align-items:flex-start">' + back + '<div class="grow"><div class="row gap8 wrap sm"><span class="pill">' + esc(k.nama) + '</span>' + Ui.badge(st) + '</div><h1 style="margin-top:6px">Pertemuan ' + p.urutan + ': ' + esc(p.judul) + '</h1>' + (p.tenggat ? '<div class="mmeta" style="font-size:13px"><span>' + ico('clock', 14) + ' Tenggat ' + esc(Wkt.fmt(p.tenggat)) + '</span></div>' : '') + '</div></div>';
  var desk = p.deskripsi ? '<section class="card mb"><p class="ink2">' + esc(p.deskripsi) + '</p></section>' : '';
  var mat = '<section class="card mb"><div class="chead"><span class="ibox">' + ico('folder') + '</span><h2 class="grow">' + (sd ? 'Bahan Belajar' : 'Materi') + '</h2></div>' + (ms.length ? '<div class="g g2" style="gap:10px">' + ms.map(Pages.fileRow).join('') + '</div>' : Ui.empty('folder', 'Belum ada materi untuk pertemuan ini.')) + '</section>';
  var tug = ts.map(function (t) { return Pages.kartuTugas(d, t, ro, selesai); }).join('');
  var aksi = '';
  if (!ro) {
    var nxt = null; var pk = K.progKelas(d, k.id); if (selesai && pk.next) nxt = pk.next;
    aksi = '<section class="card row sp wrap" style="gap:12px">' + (selesai ? '<div class="row gap8"><span class="ibox ok">' + ico('circleCheck') + '</span><div><div class="b">' + (sd ? 'Hebat! Pertemuan ini selesai 🎉' : 'Pertemuan ini sudah selesai') + '</div><div class="sm mute">' + (nxt ? 'Pertemuan berikutnya sudah terbuka.' : 'Lanjutkan ke pertemuan berikutnya dari jalur belajar.') + '</div></div></div>' + (nxt ? '<a class="btn" href="#/ruang/' + esc(nxt.id) + '">Lanjut ke pertemuan ' + nxt.urutan + ' ' + ico('arrowR', 16) + '</a>' : '<a class="btn sec" href="#/kelas/' + esc(k.id) + '">Kembali ke jalur</a>') : '<div><div class="b">' + (semuaKumpul ? 'Siap menyelesaikan pertemuan ini?' : 'Kumpulkan semua tugas dulu') + '</div><div class="sm mute">' + (semuaKumpul ? 'Menandai selesai akan membuka pertemuan berikutnya.' : 'Pertemuan bisa ditandai selesai setelah semua tugas dikumpulkan.') + '</div></div><button class="btn" data-act="ptSelesai" data-id="' + esc(p.id) + '"' + (semuaKumpul ? '' : ' disabled') + '>' + ico('check', 16) + ' Tandai selesai</button>') + '</section>';
  }
  return head + desk + mat + (tug || '') + aksi;
};
V.dibuka = {};
Pages.catatBuka = function (p) {
  var d = K.D(); d.progres.push({ id: S.me.id + '|' + p.id, peserta_id: S.me.id, pertemuan_id: p.id, status: 'dibuka', diperbarui: Wkt.now() }); K.dirty();
  Api.call('peserta.buka', { pertemuan_id: p.id }, { write: true }).then(function (r) { if (!r.success) { d.progres = d.progres.filter(function (x) { return x.pertemuan_id !== p.id; }); K.dirty(); Ui.toast(r.message, 'err'); Ui.render(); } else K.save(); });
};

Pages.kartuTugas = function (d, t, ro, ptSelesai) {
  var X = K.ix(d), riwayat = X.kmpByTugas[t.id] || [], last = riwayat[riwayat.length - 1], st = last ? last.status : 'belum', sd = K.sd();
  var tenggat = t.tenggat ? '<span>' + ico('clock', 13) + ' Tenggat ' + esc(Wkt.fmt(t.tenggat)) + '</span>' : '';
  var hist = riwayat.length ? '<h3 style="margin:16px 0 8px;font-size:14px">Riwayat pengumpulan</h3><div class="col" style="gap:8px">' + riwayat.slice().reverse().map(function (c) {
    return '<div class="filechip"><span class="fico">' + ico(c.ada_file ? 'file' : 'link', 18) + '</span><div class="grow"><div class="b trunc">v' + c.versi + ' · ' + esc(c.nama_file || c.tautan || 'Tautan') + '</div><div class="sm mute">' + esc(Wkt.fmt(c.waktu)) + (c.ukuran ? ' · ' + Ui.ukuran(c.ukuran) : '') + '</div>' + (c.umpan_balik ? '<div class="sm" style="margin-top:4px;color:var(--ink2)">' + ico('star', 12) + ' “' + esc(c.umpan_balik) + '”</div>' : '') + '</div>' + (c.status === 'dinilai' || c.status === 'revisi' ? Pages.gradeChip(c) : Ui.badge(c.status)) + (c.ada_file && !ro ? '<button class="iconbtn" data-act="ambilFile" data-tipe="kumpul" data-id="' + esc(c.id) + '" aria-label="Unduh">' + ico('download', 18) + '</button>' : '') + '</div>';
  }).join('') + '</div>' : '';
  var form = '';
  if (!ro && st !== 'dinilai') {
    form = '<div class="mt16"><div class="dz" data-act="tkPilih" data-id="' + esc(t.id) + '" id="dz-' + esc(t.id) + '"><input type="file" id="tkf-' + esc(t.id) + '" hidden data-ch="tkFile" data-id="' + esc(t.id) + '">' + ico('upload', 26) + '<div class="b" id="tkn-' + esc(t.id) + '" style="margin-top:6px">' + (sd ? 'Sentuh di sini untuk memilih file' : 'Seret file ke sini atau klik untuk memilih') + '</div><div class="hint">Format: ' + esc((t.format || '').toUpperCase().replace(/,/g, ', ')) + ' · maks ' + t.maks_mb + ' MB</div></div><div class="fld mt8"><label class="sm">Atau tempel tautan (untuk file besar)</label><input class="inp" id="tkl-' + esc(t.id) + '" placeholder="https://drive.google.com/..."></div><div class="fld mt8"><label class="sm">Catatan untuk pengajar (opsional)</label><input class="inp" id="tkc-' + esc(t.id) + '" maxlength="500"></div><button class="btn mt16" data-act="tugasKirim" data-id="' + esc(t.id) + '">' + ico('send', 16) + ' ' + (last ? 'Kirim ulang (versi ' + (last.versi + 1) + ')' : (sd ? 'Kirim tugasku' : 'Kirim tugas')) + '</button></div>';
  } else if (!ro && st === 'dinilai') form = '<div class="callout info mt16">' + ico('circleCheck', 18) + '<div>Tugas ini sudah dinilai.</div></div>';
  return '<section class="card mb"><div class="chead"><span class="ibox amb">' + ico('clipboard') + '</span><div class="grow"><h2>' + esc(t.judul) + '</h2><div class="mmeta">' + tenggat + '</div></div>' + Ui.badge(st) + '</div>' + (t.instruksi ? '<p class="ink2">' + esc(t.instruksi) + '</p>' : '') + hist + form + '</section>';
};

V.up = {};
Acts.tkPilih = function (el, e) { if (e.target.tagName === 'INPUT') return; document.getElementById('tkf-' + el.dataset.id).click(); };
Acts.tkFile = function (el) {
  var id = el.dataset.id, f = el.files[0]; if (!f) return; var d = K.D(), t = K.ix(d).tugas[id], ext = (f.name.split('.').pop() || '').toLowerCase(), ok = String(t.format || '').split(',').filter(Boolean);
  if (ok.length && ok.indexOf(ext) < 0) { el.value = ''; return Ui.toast('Format .' + ext + ' tidak diizinkan. Gunakan: ' + ok.join(', ') + '.', 'err'); }
  if (f.size > t.maks_mb * 1048576) { el.value = ''; return Ui.toast('File melebihi ' + t.maks_mb + ' MB. Gunakan tautan Drive untuk file besar.', 'err'); }
  V.up[id] = f; document.getElementById('tkn-' + id).textContent = f.name + ' (' + Ui.ukuran(f.size) + ')'; document.getElementById('dz-' + id).classList.add('over');
};
Acts.tugasKirim = async function (el) {
  var id = el.dataset.id, d = K.D(), f = V.up[id], tautan = F('tkl-' + id).trim();
  if (!f && !tautan) return Ui.toast('Pilih file atau tempel tautan tugas.', 'err');
  if (!f && !/^https?:\/\//i.test(tautan)) return Ui.toast('Tautan harus diawali http:// atau https://', 'err');
  var data = { tugas_id: id, catatan: F('tkc-' + id), tautan: f ? '' : tautan };
  if (f) { data.nama_file = f.name; data.mime = f.type; data.base64 = await Ui.bacaFile(f); }
  var r = await K.aksi('tugas.kirim', data, { btn: el, label: f ? 'Mengunggah...' : 'Mengirim...' }); if (!r) return;
  d.pengumpulan.push(r.data); delete V.up[id];
  var t = K.ix(d).tugas[id]; if (t && !d.progres.some(function (x) { return x.pertemuan_id === t.pertemuan_id; })) d.progres.push({ id: S.me.id + '|' + t.pertemuan_id, peserta_id: S.me.id, pertemuan_id: t.pertemuan_id, status: 'dibuka', diperbarui: Wkt.now() });
  K.dirty(); K.save(); Ui.render();
};
Acts.ptSelesai = function (el) {
  var d = K.D(), id = el.dataset.id, X = K.ix(d), p = X.pt[id], pr = X.prog[id], lamaProg = d.progres.slice();
  K.aksi('peserta.selesai', { pertemuan_id: id }, {
    opt: function () { if (pr) { pr.status = 'selesai'; pr.diperbarui = Wkt.now(); } else d.progres.push({ id: S.me.id + '|' + id, peserta_id: S.me.id, pertemuan_id: id, status: 'selesai', diperbarui: Wkt.now() }); K.dirty(); },
    undo: function () { d.progres = lamaProg; if (pr) pr.status = 'dibuka'; K.dirty(); }
  });
};

/* =================== TUGAS & NILAI (PESERTA) =================== */
Pages.tugasSaya = function () {
  var d = K.D(), X = K.ix(d), sd = K.sd();
  if (S.me.role !== 'peserta') { location.hash = '#/'; return ''; }
  var rows = (d.tugas || []).map(function (t) { var p = X.pt[t.pertemuan_id], k = p && X.kelas[p.kelas_id], c = K.kmpTerakhir(d, t.id); return { t: t, p: p, k: k, c: c, st: c ? c.status : 'belum', akses: p ? K.akses(d, p) : 'terkunci' }; }).sort(function (a, b) { return (a.t.tenggat || '9') > (b.t.tenggat || '9') ? 1 : -1; });
  return P.head(sd ? 'Tugas & Nilaiku' : 'Tugas & Nilai', 'Semua tugas dari kelas Anda dalam satu tempat.') + '<div class="card flush">' + (rows.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Tugas</th><th class="hide-m">Kelas</th><th>Tenggat</th><th>Status</th><th>Nilai</th><th></th></tr></thead><tbody>' + rows.map(function (r) {
    var l = r.t.tenggat ? P.dayLabel(Wkt.selisihHari(r.t.tenggat), r.t.tenggat) : null;
    return '<tr><td><div class="b">' + esc(r.t.judul) + '</div><div class="sm mute">Pertemuan ' + (r.p ? r.p.urutan : '-') + '</div></td><td class="hide-m">' + esc(r.k ? r.k.nama : '-') + '</td><td>' + esc(r.t.tenggat ? Wkt.tgl(r.t.tenggat) : '-') + (l && !r.c ? ' <span class="badge ' + l[1] + '">' + esc(l[0]) + '</span>' : '') + '</td><td>' + Ui.badge(r.st) + '</td><td>' + (r.c && r.c.status === 'dinilai' ? Pages.gradeChip(r.c) : '-') + '</td><td class="tr">' + (r.akses === 'terkunci' || r.akses === 'belum_buka' ? '<span class="sm mute">' + ico('lock', 14) + '</span>' : '<a class="btn soft sm" href="#/ruang/' + esc(r.p.id) + '">' + (r.c ? 'Lihat' : 'Kerjakan') + '</a>') + '</td></tr>';
  }).join('') + '</tbody></table></div>' : Ui.empty('clipboard', 'Belum ada tugas.')) + '</div>';
};
