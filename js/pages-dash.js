/** pages-dash.js — Kerangka halaman bersama + dashboard (admin/pengajar, peserta, orang tua). */
window.Pages = {}; window.Acts = {}; window.V = {};
window.P = {
  head: function (judul, sub, kanan) {
    return '<div class="row sp wrap mb" style="gap:16px"><div class="grow"><h1>' + esc(judul) + '</h1>' + (sub ? '<div class="mute">' + sub + '</div>' : '') + '</div>' + (kanan ? '<div class="row wrap gap8">' + kanan + '</div>' : '') + '</div>';
  },
  card: function (judul, icon, body, kanan, cls) {
    return '<section class="card ' + (cls || '') + '"><div class="chead"><span class="ibox">' + ico(icon || 'info') + '</span><h2 class="grow">' + esc(judul) + '</h2>' + (kanan || '') + '</div>' + body + '</section>';
  },
  stat: function (icon, label, num, a, b) {
    return '<div class="card stat"><div class="top2"><span class="ibox">' + ico(icon) + '</span><div><div class="mute">' + esc(label) + '</div><div class="num">' + esc(num) + '</div></div></div><div class="foot"><span>' + esc(a[0]) + ': <b>' + esc(a[1]) + '</b></span>' + (b ? '<span>' + esc(b[0]) + ': <b class="' + (b[2] || '') + '">' + esc(b[1]) + '</b></span>' : '') + '</div></div>';
  },
  warna: { biru: ['#dbe1ff', '#004ac6'], hijau: ['#bbf7d0', '#166534'], oranye: ['#ffddb8', '#653e00'], ungu: ['#e9d5ff', '#6b21a8'] },
  kelasIkon: function (k) { var w = P.warna[k.warna] || P.warna.biru; return '<span class="ibox" style="background:' + w[0] + ';color:' + w[1] + '">' + ico('school') + '</span>'; },
  pesanKosong: function (t) { return '<div class="card">' + Ui.empty('info', t) + '</div>'; },
  dayLabel: function (sisa, tenggat) {
    if (sisa < 0) return ['Terlambat', 'b-err']; if (sisa < 1) return ['Hari ini', 'b-amb']; if (sisa < 2) return ['Besok', 'b-amb'];
    if (sisa < 7) return [Math.ceil(sisa) + ' hari lagi', 'b-pri']; return [Wkt.pendek(tenggat), 'b-gray'];
  }
};

/* ============ DASHBOARD STAF (admin & pengajar) ============ */
Pages.dashboard = function () {
  if (S.me.role === 'peserta') return Pages.dashPeserta();
  if (S.me.role === 'ortu') return Pages.dashOrtu();
  var b = S.boot, st = b.stats, adm = S.me.role === 'admin', X = K.ix(b);
  var kartu = '<div class="g g4 m2 mb">' +
    P.stat('school', 'Kelas', st.kelas.total, ['Aktif', st.kelas.aktif], ['Akan datang', st.kelas.akan_datang]) +
    P.stat('video', 'Pertemuan', st.pertemuan.total, ['Terbit', st.pertemuan.terbit], ['Terjadwal', st.pertemuan.terjadwal]) +
    P.stat('users', 'Peserta', st.peserta.total, ['Aktif', st.peserta.aktif], ['Baru (30 hari)', st.peserta.baru]) +
    P.stat('bell', 'Notifikasi', '—', ['Tersedia di tahap 2', 'WA & Email']) + '</div>';

  var ak = b.aktivitas, trend = ak.persen == null ? '' : '<span class="trend ' + (ak.persen < 0 ? 'dn' : '') + '">' + (ak.persen >= 0 ? '+' : '') + ak.persen + '% dari tahun lalu</span>';
  var area = '<section class="card"><div class="chead"><span class="ibox">' + ico('chart') + '</span><div class="grow"><div class="mute sm">Keaktifan Peserta</div><div class="row gap8 wrap"><span style="font-size:28px;font-weight:700;letter-spacing:-.02em">' + ak.total.toLocaleString('id-ID') + '</span>' + trend + '</div></div></div>' +
    (ak.total || ak.ini.some(Boolean) ? Ui.areaChart({ labels: Wkt.bln, a: ak.ini, b: ak.lalu, nameA: 'Tahun ' + ak.tahun, nameB: 'Tahun ' + (ak.tahun - 1), aria: 'Keaktifan peserta per bulan' }) +
      '<div class="leg mt8"><span><i style="background:#2563eb"></i>Tahun ' + ak.tahun + '</span><span><i style="background:#f59e0b"></i>Tahun ' + (ak.tahun - 1) + '</span><span class="mute">Aktivitas = progres belajar + pengumpulan tugas</span></div>' : Ui.empty('chart', 'Belum ada aktivitas belajar tahun ini.')) + '</section>';

  var sb = b.selesaiBulanan, bar = '<section class="card"><div class="chead"><span class="ibox">' + ico('target') + '</span><h2 class="grow">Penyelesaian Pertemuan</h2><span class="pill">6 bulan terakhir</span></div>' +
    (sb.some(function (x) { return x.total; }) ? Ui.barChart({ aria: 'Penyelesaian pertemuan per bulan', items: sb.map(function (x) { return { label: Wkt.blnLabel(x.bulan), pct: x.persen, tip: '<b>' + Wkt.blnLabel(x.bulan) + '</b><br>Selesai: <b>' + x.persen + '%</b> (' + x.selesai + '/' + x.total + ')' }; }) }) : Ui.empty('target', 'Belum ada data penyelesaian.')) + '</section>';

  var antre = b.antreanNilai.length ? b.antreanNilai.map(function (a) {
    return '<a class="lrow click" href="#/penilaian/' + esc(a.id) + '">' + Ui.avatar(a.peserta_nama) + '<div class="grow"><div class="t trunc">' + esc(a.peserta_nama) + '</div><div class="s trunc">' + esc(a.tugas_judul) + ' · ' + esc(a.kelas_nama) + '</div></div><div class="sm mute tr hide-m">' + esc(Wkt.rel(a.waktu)) + '</div><span class="round">' + ico('arrowR', 16) + '</span></a>';
  }).join('') : Ui.empty('circleCheck', 'Semua tugas sudah dinilai. Kerja bagus!');
  var cAntre = '<section class="card"><div class="chead"><span class="ibox">' + ico('clipboard') + '</span><h2 class="grow">Tugas Menunggu Penilaian</h2><a class="btn gh sm" href="#/penilaian">Lihat semua</a></div>' + antre + '</section>';

  var kls = b.kelas.slice().sort(function (a, c) { return (b.ringkas[c.id] ? b.ringkas[c.id].anggota : 0) - (b.ringkas[a.id] ? b.ringkas[a.id].anggota : 0); }).slice(0, 4);
  var cTop = '<section class="card"><div class="chead"><span class="ibox">' + ico('book') + '</span><h2 class="grow">Kelas Teratas</h2><a class="btn gh sm" href="#/kelas">Lihat semua ' + ico('arrowR', 14) + '</a></div>' +
    (kls.length ? kls.map(function (k) { var r = b.ringkas[k.id] || {}; return '<a class="lrow click" href="#/kelas/' + esc(k.id) + '">' + P.kelasIkon(k) + '<div class="grow t trunc">' + esc(k.nama) + '</div><span class="pill">' + (r.anggota || 0) + ' peserta</span></a>'; }).join('') : Ui.empty('school', 'Belum ada kelas.', '<div class="mt8"><a class="btn sm" href="#/kelas">Buat kelas</a></div>')) + '</section>';

  var best = b.kelas.slice().filter(function (k) { return (b.ringkas[k.id] || {}).pertemuan; }).sort(function (a, c) { return b.ringkas[c.id].pct - b.ringkas[a.id].pct; }).slice(0, 5);
  var c10 = '<section class="card"><div class="chead"><span class="ibox">' + ico('star') + '</span><h2 class="grow">Kelas dengan Penyelesaian Tertinggi</h2></div>' +
    (best.length ? best.map(function (k, i) { return '<div class="row sp" style="padding:7px 2px"><span class="trunc"><b style="color:var(--pri)">' + String(i + 1).padStart(2, '0') + '.</b> ' + esc(k.nama) + '</span><b>' + b.ringkas[k.id].pct + '%</b></div>'; }).join('') : Ui.empty('star', 'Belum ada data.')) + '</section>';

  var tot = b.kelas.length, nAk = st.kelas.aktif, nSel = st.kelas.selesai, nAkan = st.kelas.akan_datang;
  var cDon = '<section class="card"><div class="chead"><span class="ibox">' + ico('target') + '</span><h2 class="grow">Ringkasan Kelas</h2></div><div class="row gap16 wrap"><div>' + Ui.donut([{ v: nAk, c: '#2563eb' }, { v: nSel, c: '#16a34a' }, { v: nAkan, c: '#c9d4ff' }], nAk + nSel + nAkan, 'Total') + '</div><div class="col gap8 grow" style="gap:8px"><div class="row sp"><span class="leg"><span><i style="background:#2563eb"></i>Aktif</span></span><b>' + nAk + '</b></div><div class="row sp"><span class="leg"><span><i style="background:#16a34a"></i>Selesai</span></span><b>' + nSel + '</b></div><div class="row sp"><span class="leg"><span><i style="background:#c9d4ff"></i>Akan datang</span></span><b>' + nAkan + '</b></div></div></div></section>';

  var pas = b.pasif.length ? b.pasif.slice(0, 5).map(function (p) { return '<div class="lrow">' + Ui.avatar(p.nama, 's') + '<div class="grow"><div class="t trunc">' + esc(p.nama) + '</div><div class="s">' + (p.terakhir ? 'Terakhir aktif ' + esc(Wkt.rel(p.terakhir)) : 'Belum pernah aktif') + '</div></div><span class="badge b-amb">' + (p.hari > 999 ? 'Belum mulai' : p.hari + ' hari') + '</span></div>'; }).join('') : Ui.empty('circleCheck', 'Tidak ada peserta pasif.');
  var cPas = '<section class="card"><div class="chead"><span class="ibox amb">' + ico('alert') + '</span><h2 class="grow">Peserta Pasif</h2><a class="btn gh sm" href="#/laporan">Laporan</a></div>' + pas + '</section>';
  var cNot = '<section class="card"><div class="chead"><span class="ibox">' + ico('bell') + '</span><h2 class="grow">Performa Notifikasi</h2><span class="badge b-amb">Tahap 2</span></div><div class="callout info">' + ico('info', 18) + '<div>Notifikasi otomatis lewat WhatsApp dan Email CRM akan tersedia di tahap berikutnya. Data peserta dan status belajar sudah siap dipakai sebagai pemicunya.</div></div></section>';

  return kartu + '<div class="g g21 mb">' + area + bar + '</div><div class="g g2 mb">' + cAntre + cTop + '</div><div class="g g3 mb">' + c10 + cDon + (adm ? cNot : cPas) + '</div>' + (adm ? '<div class="g g2 mb">' + cPas + '<div></div></div>' : '');
};

/* ============ DASHBOARD PESERTA ============ */
Pages.dashPeserta = function () {
  var d = K.D(), X = K.ix(d), sd = K.sd(), nama = S.me.nama.split(' ')[0];
  if (!d.kelas.length) return P.head(sd ? 'Halo, ' + nama + '! 👋' : 'Selamat datang, ' + nama) + P.pesanKosong('Kamu belum terdaftar di kelas mana pun. Hubungi pengajar atau admin untuk bergabung.');
  var kid = V.dashKelas && X.kelas[V.dashKelas] ? V.dashKelas : (d.kelas.find(function (k) { return K.progKelas(d, k.id).next; }) || d.kelas[0]).id; V.dashKelas = kid;
  var k = X.kelas[kid], pk = K.progKelas(d, kid), nx = pk.next;
  var pilih = d.kelas.length > 1 ? '<select class="sel sm" data-ch="dashKelas" style="background-color:#fff;color:#131b2e">' + Ui.opt(d.kelas, 'id', 'nama', kid) + '</select>' : '';
  var sapa = sd ? 'Halo, ' + esc(nama) + '! 👋' : 'Selamat datang kembali, ' + esc(nama);
  var sub = sd ? 'Kamu sudah menyelesaikan <b>' + pk.selesai + ' dari ' + pk.total + '</b> pertemuan. Ayo lanjut belajar!' : 'Anda telah menyelesaikan <b>' + pk.selesai + ' dari ' + pk.total + '</b> pertemuan. Pertahankan ritme belajar Anda.';
  var kananHero;
  if (nx) {
    var tg = (X.tugasByPt[nx.id] || [])[0];
    kananHero = '<div class="next"><div class="row sp"><span class="pill">' + (sd ? 'Ayo mulai' : 'Langkah berikutnya') + '</span>' + (nx.tenggat ? '<span class="sm mute">' + ico('clock', 14) + ' Tenggat ' + esc(Wkt.pendek(nx.tenggat)) + '</span>' : '') + '</div><h3 style="margin:10px 0 4px;font-size:18px">' + esc('Pertemuan ' + nx.urutan + ': ' + nx.judul) + '</h3><p class="mute sm" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(nx.deskripsi || 'Pelajari materi dan kerjakan tugas pada pertemuan ini.') + '</p><div class="row sp mt16 wrap"><div class="row gap8">' + Ui.avatar(k.pengajar_nama || '?', 's') + '<div><div class="b sm">' + esc(k.pengajar_nama || '-') + '</div><div class="sm mute">Pengajar</div></div></div><a class="btn" href="#/ruang/' + esc(nx.id) + '">' + (sd ? 'Ayo belajar' : 'Lanjutkan') + ' ' + ico('arrowR', 16) + '</a></div></div>';
  } else {
    var selesaiSemua = pk.total && pk.selesai === pk.total;
    kananHero = '<div class="next tc">' + ico(selesaiSemua ? 'circleCheck' : 'clock', 40, '') + '<h3 style="margin:8px 0 4px">' + (selesaiSemua ? (sd ? 'Hebat! Semua selesai 🎉' : 'Semua pertemuan selesai') : 'Belum ada pertemuan terbuka') + '</h3><p class="mute sm">' + (selesaiSemua ? 'Pantau nilai dan umpan balik Anda di bawah.' : 'Pertemuan berikutnya akan terbuka sesuai jadwal atau setelah prasyarat selesai.') + '</p></div>';
  }
  var hero = '<div class="hero mb"><div><div class="row gap8 wrap" style="margin-bottom:10px"><span class="chipw">' + esc(k.nama) + '</span>' + pilih + '</div><h1 style="font-size:28px;line-height:36px">' + sapa + '</h1><p style="opacity:.9;margin:8px 0 16px">' + sub + '</p><div class="row sp sm" style="margin-bottom:6px"><span>Kemajuan belajar</span><b>' + pk.pct + '%</b></div><div class="bar"><i style="width:' + pk.pct + '%"></i></div></div>' + kananHero + '</div>';

  var peta = '<section class="card mb"><div class="row sp wrap mb"><div><div class="kicker">' + esc(k.nama) + '</div><h2>' + (sd ? 'Peta Belajarku' : 'Peta Jalur Belajar') + '</h2></div><div class="leg"><span><i style="background:#16a34a"></i>Selesai</span><span><i style="background:#2563eb"></i>Sedang berjalan</span><span><i style="background:#c9d4ff"></i>Terkunci</span></div></div>' + Pages.petaJalur(d, pk) + '</section>';

  var dl = K.tenggat(d).slice(0, 4), cDl = '<section class="card"><div class="chead"><span class="ibox amb">' + ico('calendar') + '</span><h2 class="grow">' + (sd ? 'Tugas yang Harus Dikerjakan' : 'Tenggat Terdekat') + '</h2></div>' +
    (dl.length ? dl.map(function (x) { var l = P.dayLabel(x.sisa, x.t.tenggat); return '<div class="lrow" style="' + (x.sisa < 2 ? 'background:#fff4e5' : '') + '"><span class="badge ' + l[1] + '">' + esc(l[0]) + '</span><div class="grow"><div class="t trunc">' + esc(x.t.judul) + '</div><div class="s trunc">Pertemuan ' + x.p.urutan + ' · ' + esc(Wkt.tgl(x.t.tenggat)) + ', ' + Wkt.jam(x.t.tenggat) + '</div></div><a class="btn soft sm" href="#/ruang/' + esc(x.p.id) + '">' + (S.me.role === 'peserta' ? 'Kerjakan' : 'Lihat') + '</a></div>'; }).join('') : Ui.empty('circleCheck', sd ? 'Tidak ada tugas. Hore! 🎉' : 'Tidak ada tenggat yang menunggu.')) + '</section>';
  return hero + peta + '<div class="g g2 mb">' + cDl + Pages.kartuNilai(d) + '</div>';
};

Pages.kartuNilai = function (d) {
  var sd = K.sd(), nl = K.nilaiTerbaru(d).slice(0, 4);
  return '<section class="card"><div class="chead"><span class="ibox">' + ico('star') + '</span><h2 class="grow">' + (sd ? 'Nilai & Pesan dari Guru' : 'Nilai & Umpan Balik Terbaru') + '</h2>' + (S.me.role === 'peserta' ? '<a class="btn gh sm" href="#/tugas">Semua</a>' : '') + '</div>' +
    (nl.length ? nl.map(function (x) { return '<div class="lrow"><div class="grow"><div class="t trunc">' + esc(x.t.judul) + '</div><div class="s" style="display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden">' + (x.c.umpan_balik ? '“' + esc(x.c.umpan_balik) + '”' : 'Pertemuan ' + (x.p ? x.p.urutan : '')) + '</div></div>' + Pages.gradeChip(x.c) + '</div>'; }).join('') : Ui.empty('star', 'Belum ada nilai.')) + '</section>';
};
Pages.gradeChip = function (c) {
  if (c.status === 'revisi') return '<span class="badge b-amb">Perlu revisi</span>';
  var n = Math.round(c.nilai); return '<span class="grade ' + (n >= 75 ? '' : n >= 60 ? 'mid' : 'low') + '">' + (K.sd() ? (n >= 90 ? '⭐ ' : '') : '') + n + '/100</span>';
};

/** Peta jalur belajar: simpul per pertemuan (selesai / berjalan / terkunci). */
Pages.petaJalur = function (d, pk) {
  if (!pk.nodes.length) return Ui.empty('route', 'Belum ada pertemuan terbit.');
  var cur = pk.next ? pk.next.id : null;
  return '<div class="pmap">' + pk.nodes.map(function (n) {
    var cls = n.st === 'selesai' ? 'done' : (n.p.id === cur ? 'cur' : (n.st === 'terkunci' || n.st === 'belum_buka') ? 'lock' : ''), ic = n.st === 'selesai' ? 'check' : n.st === 'terkunci' ? 'lock' : n.st === 'belum_buka' ? 'clock' : 'play';
    var lbl = n.st === 'selesai' ? 'Selesai' : n.st === 'terkunci' ? 'Terkunci' : n.st === 'belum_buka' ? 'Dibuka ' + Wkt.pendek(n.p.buka) : (n.p.id === cur ? 'Sedang berjalan' : 'Terbuka');
    var tip = n.st === 'terkunci' ? 'Selesaikan pertemuan prasyarat lebih dulu' : '';
    var el = (n.st === 'terkunci' || n.st === 'belum_buka') ? 'div' : 'a';
    return '<' + el + ' class="pnode ' + cls + '"' + (el === 'a' ? ' href="#/ruang/' + esc(n.p.id) + '"' : '') + (tip ? ' data-tip="' + esc(tip) + '"' : '') + '><div class="circ">' + ico(ic, 22) + '</div><div class="sm ' + (cls === 'done' ? '' : 'mute') + '" style="' + (cls === 'cur' ? 'color:var(--pri);font-weight:600' : cls === 'done' ? 'color:#166534;font-weight:600' : '') + '">Pertemuan ' + n.p.urutan + '</div><div class="b" style="margin:2px 0 8px;line-height:1.3">' + esc(n.p.judul) + '</div><span class="badge ' + (cls === 'done' ? 'b-ok' : cls === 'cur' ? 'b-pri' : 'b-gray') + '">' + esc(lbl) + '</span></' + el + '>';
  }).join('') + '</div>';
};

Acts.dashKelas = function (el) { V.dashKelas = el.value; Ui.render(); };

/* ============ DASHBOARD ORANG TUA ============ */
Pages.dashOrtu = function () {
  var b = S.boot, anak = b.anak || [];
  if (!anak.length) return P.head('Selamat datang, ' + esc(S.me.nama)) + P.pesanKosong('Belum ada anak yang terhubung dengan akun Anda. Hubungi admin untuk menautkan.');
  var d = K.D(), a = d.user, X = K.ix(d);
  var chips = anak.length > 1 ? '<div class="chips mb">' + anak.map(function (x) { return '<span class="chip ' + (x.user.id === a.id ? 'on' : '') + '" data-act="pilihAnak" data-id="' + esc(x.user.id) + '">' + esc(x.user.nama) + '</span>'; }).join('') + '</div>' : '';
  var kls = d.kelas.map(function (k) { return { k: k, pk: K.progKelas(d, k.id) }; });
  var avg = kls.length ? Math.round(kls.reduce(function (s, x) { return s + x.pk.pct; }, 0) / kls.length) : 0;
  var ringC = '<section class="card"><div class="chead"><span class="ibox">' + ico('target') + '</span><h2 class="grow">Ringkasan Belajar ' + esc(a.nama.split(' ')[0]) + '</h2></div><div class="row gap16 wrap"><div>' + Ui.ring(avg, 120) + '</div><div class="grow col" style="gap:12px">' + (kls.length ? kls.map(function (x) { return '<div><div class="row sp sm"><b class="trunc">' + esc(x.k.nama) + '</b><span>' + x.pk.selesai + '/' + x.pk.total + '</span></div>' + Ui.progress(x.pk.pct) + '</div>'; }).join('') : '<span class="mute">Belum terdaftar di kelas.</span>') + '</div></div></section>';
  var dl = K.tenggat(d).slice(0, 5), cDl = '<section class="card"><div class="chead"><span class="ibox amb">' + ico('calendar') + '</span><h2 class="grow">Tenggat Terdekat</h2></div>' + (dl.length ? dl.map(function (x) { var l = P.dayLabel(x.sisa, x.t.tenggat); return '<div class="lrow"><span class="badge ' + l[1] + '">' + esc(l[0]) + '</span><div class="grow"><div class="t trunc">' + esc(x.t.judul) + '</div><div class="s">' + esc(x.k.nama) + ' · ' + esc(Wkt.tgl(x.t.tenggat)) + '</div></div></div>'; }).join('') : Ui.empty('circleCheck', 'Tidak ada tenggat yang menunggu.')) + '</section>';
  var st = [];
  (d.tugas || []).forEach(function (t) { var p = X.pt[t.pertemuan_id]; st.push({ t: t, p: p, s: K.tugasStatus(d, t) }); });
  var cSt = '<section class="card"><div class="chead"><span class="ibox">' + ico('clipboard') + '</span><h2 class="grow">Status Tugas</h2></div>' + (st.length ? st.slice(0, 8).map(function (x) { return '<div class="lrow"><div class="grow"><div class="t trunc">' + esc(x.t.judul) + '</div><div class="s">Pertemuan ' + (x.p ? x.p.urutan : '-') + '</div></div>' + Ui.badge(x.s) + '</div>'; }).join('') : Ui.empty('clipboard', 'Belum ada tugas.')) + '</section>';
  var cNot = '<section class="card"><div class="chead"><span class="ibox">' + ico('bell') + '</span><h2 class="grow">Riwayat Notifikasi</h2><span class="badge b-amb">Tahap 2</span></div><div class="callout info">' + ico('info', 18) + '<div>Pengingat jadwal dan tenggat lewat WhatsApp/Email akan tersedia di tahap berikutnya.</div></div></section>';
  return P.head(Wkt.salam() + ', ' + esc(S.me.nama), 'Pantau perkembangan belajar anak Anda.') + chips + '<div class="g g2 mb">' + ringC + cDl + '</div><div class="g g2 mb">' + Pages.kartuNilai(d) + cSt + '</div>' + cNot;
};
Acts.pilihAnak = function (el) { S.anakId = el.dataset.id; K.save(); Ui.render(); };
