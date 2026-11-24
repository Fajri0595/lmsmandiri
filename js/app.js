/** app.js — Kerangka aplikasi: login, shell (sidebar/topbar/bottom-nav), router hash, delegasi event, render aman, inisialisasi. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var MENU = {
    admin: [['dashboard', '#/', 'Dashboard', 'dashboard'], ['kelas', '#/kelas', 'Kelas', 'school'], ['jalur', '#/jalur', 'Jalur Belajar', 'route'], ['pertemuan', '#/pertemuan', 'Pertemuan & Materi', 'video'], ['penilaian', '#/penilaian', 'Tugas & Penilaian', 'clipboard'], ['pengguna', '#/pengguna', 'Pengguna', 'users'], ['notifikasi', '#/notifikasi', 'Notifikasi', 'bell', 'Tahap 2'], ['laporan', '#/laporan', 'Laporan', 'chart'], ['pengaturan', '#/pengaturan', 'Pengaturan', 'settings'], ['profil', '#/profil', 'Profil', 'user']],
    pengajar: [['dashboard', '#/', 'Dashboard', 'dashboard'], ['kelas', '#/kelas', 'Kelas', 'school'], ['jalur', '#/jalur', 'Jalur Belajar', 'route'], ['pertemuan', '#/pertemuan', 'Pertemuan & Materi', 'video'], ['penilaian', '#/penilaian', 'Tugas & Penilaian', 'clipboard'], ['laporan', '#/laporan', 'Laporan', 'chart'], ['profil', '#/profil', 'Profil', 'user']],
    peserta: [['dashboard', '#/', 'Beranda', 'dashboard'], ['kelas', '#/kelas', 'Kelas Saya', 'school'], ['tugas', '#/tugas', 'Tugas & Nilai', 'clipboard'], ['profil', '#/profil', 'Profil', 'user']],
    ortu: [['dashboard', '#/', 'Beranda', 'dashboard'], ['profil', '#/profil', 'Profil', 'user']]
  };
  var BNAV = { admin: ['dashboard', 'kelas', 'penilaian', 'pengguna'], pengajar: ['dashboard', 'kelas', 'penilaian', 'laporan'], peserta: ['dashboard', 'kelas', 'tugas', 'profil'], ortu: ['dashboard', 'profil'] };
  var EXTRA = { peserta: ['ruang'], ortu: ['ruang'] };

  function parts() { var h = (location.hash || '#/').replace(/^#\/?/, ''); return h.split('/').filter(Boolean).map(decodeURIComponent); }
  function menu() { return MENU[S.me.role] || []; }
  function boleh(nama) { return nama === '' || menu().some(function (m) { return m[0] === nama; }) || (EXTRA[S.me.role] || []).indexOf(nama) > -1; }

  var App = {
    /* ---------- LOGIN ---------- */
    showLogin: function (pesan) {
      Sync.stop(); $('app').hidden = true; $('boot').hidden = true; var L = $('login'); L.hidden = false; document.body.classList.remove('sd');
      var nama = ''; try { nama = localStorage.getItem('lms_appname') || ''; } catch (e) { } nama = nama || CFG.NAMA_APP; document.title = nama;
      L.innerHTML = '<div class="login-wrap"><form class="login-card" id="lf" autocomplete="on" novalidate><div class="row" style="margin-bottom:22px"><span class="logo">' + ico('school', 22) + '</span><div><b style="font-size:17px">' + esc(nama) + '</b><div class="sm mute">Portal Pembelajaran</div></div></div><h1>Selamat datang</h1><p class="mute" style="margin:4px 0 20px">Masuk untuk melanjutkan belajar dan mengajar.</p>' +
        '<div id="lf-std"><div class="fld"><label for="lf-email">Email</label><div class="iw"><span>' + ico('mail', 18) + '</span><input class="inp" id="lf-email" type="email" autocomplete="username" inputmode="email" placeholder="nama@email.com"></div></div><div class="fld mt16"><label for="lf-kode">Kode akses</label><div class="iw"><span>' + ico('key', 18) + '</span><input class="inp" id="lf-kode" type="password" autocomplete="current-password" placeholder="Kode akses dari admin"></div></div></div>' +
        '<div id="lf-dar" hidden><div class="callout mb">' + ico('alert', 18) + '<div>Akses darurat hanya untuk pemulihan bila admin tidak bisa masuk.</div></div><div class="fld"><label>Nama pengguna darurat</label><input class="inp" id="lf-du" autocomplete="off"></div><div class="fld mt16"><label>Kata sandi darurat</label><input class="inp" id="lf-dp" type="password" autocomplete="off"></div></div>' +
        '<div class="ferr mt8" id="lf-err" role="alert">' + esc(pesan || '') + '</div><button class="btn blk mt16" id="lf-go" type="submit">Masuk ' + ico('arrowR', 16) + '</button>' +
        '<div class="row sp mt24 sm"><button type="button" class="btn gh sm" data-act="loginBantuan" style="padding:0">' + ico('help', 16) + ' Butuh bantuan masuk?</button><button type="button" class="btn gh sm" data-act="loginDarurat" style="padding:0;color:var(--mute)">Akses darurat</button></div></form></div>';
      $('lf').onsubmit = function (e) { e.preventDefault(); App.login(); };
      Api.call('app.info', {}).then(function (r) { if (r.success && r.data && r.data.nama) { try { localStorage.setItem('lms_appname', r.data.nama); } catch (e) { } if (!$('app') || $('app').hidden) { document.title = r.data.nama; var b = document.querySelector('#lf b'); if (b) b.textContent = r.data.nama; } } });
      setTimeout(function () { var f = $('lf-email'); if (f) f.focus(); }, 50);
    },
    login: async function () {
      var dar = !$('lf-dar').hidden, btn = $('lf-go'), err = $('lf-err'); err.textContent = '';
      var data, aksi;
      if (dar) { aksi = 'auth.darurat'; data = { username: $('lf-du').value.trim(), password: $('lf-dp').value }; if (!data.username || !data.password) { err.textContent = 'Isi nama pengguna dan kata sandi darurat.'; return; } }
      else { aksi = 'auth.login'; data = { email: $('lf-email').value.trim(), kode: $('lf-kode').value.trim() }; if (!data.email || !data.kode) { err.textContent = 'Isi email dan kode akses.'; return; } }
      Ui.sibuk(btn, true, 'Memeriksa...');
      var r = await Api.call(aksi, data, { write: true });
      Ui.sibuk(btn, false);
      if (!r.success) { err.textContent = r.message || 'Gagal masuk.'; return; }
      K.setSesi(r.data.token, r.data.me, r.data.boot); App.masuk();
    },
    masuk: function () {
      $('login').hidden = true; $('login').innerHTML = ''; $('boot').hidden = true; $('app').hidden = false;
      try { localStorage.setItem('lms_appname', K.namaApp()); } catch (e) { }
      document.title = K.namaApp(); V.dibuka = {};
      if (!location.hash || !boleh(parts()[0] || '')) location.hash = '#/';
      App.shell(); Ui.render(); Sync.start();
      if (S.me.role === 'admin' || S.me.role === 'pengajar') setTimeout(function () { Sync.muatBerat(); }, 1200);
    },
    logout: function () { K.clear(); Sync.stop(); V = {}; location.hash = '#/'; App.showLogin(); },

    /* ---------- SHELL ---------- */
    shell: function () {
      var role = S.me.role, items = menu(), cur = parts()[0] || 'dashboard', mini = false; try { mini = localStorage.getItem('lms_mini') === '1'; } catch (e) { }
      var side = $('side'); side.className = 'side' + (mini ? ' mini' : '') + (side.classList.contains('open') ? ' open' : '');
      side.innerHTML = '<div class="brand"><span class="logo">' + ico('school', 20) + '</span><div class="grow"><b>' + esc(K.namaApp()) + '</b><small>Portal Pembelajaran</small></div><button class="iconbtn" style="width:32px;height:32px" data-act="miniSide" aria-label="Ciutkan menu">' + ico('panel', 18) + '</button></div><nav class="nav" aria-label="Menu utama">' + items.map(function (m) { return '<a href="' + m[1] + '" data-nav="' + m[0] + '" title="' + esc(m[2]) + '">' + ico(m[3], 20) + '<span class="lbl">' + esc(m[2]) + '</span>' + (m[4] ? '<span class="tag">' + m[4] + '</span>' : '') + '</a>'; }).join('') + '</nav>';
      var bn = (BNAV[role] || []).map(function (k) { return items.find(function (m) { return m[0] === k; }); }).filter(Boolean);
      $('bnav').innerHTML = bn.map(function (m) { return '<a href="' + m[1] + '" data-nav="' + m[0] + '">' + ico(m[3], 22) + '<span>' + esc(m[2].replace('Tugas & Penilaian', 'Penilaian').replace('Pertemuan & Materi', 'Materi').replace('Tugas & Nilai', 'Tugas')) + '</span></a>'; }).join('') + (items.length > bn.length ? '<a href="#" data-act="bukaSide">' + ico('menu', 22) + '<span>Menu</span></a>' : '');
    },
    topbar: function (p) {
      var nama = S.me.nama.split(' ')[0], name = p[0] || 'dashboard', m = menu().find(function (x) { return x[0] === name; });
      var judul, sub;
      if (name === 'dashboard') { judul = K.namaApp(); sub = Wkt.salam() + ', ' + nama + '!'; }
      else if (name === 'ruang') { judul = 'Ruang Pertemuan'; sub = K.namaApp(); }
      else { judul = m ? m[2] : K.namaApp(); sub = K.namaApp(); }
      var n = App.notif().length;
      $('top').innerHTML = '<button class="iconbtn menu-btn" data-act="bukaSide" aria-label="Buka menu">' + ico('menu') + '</button><div class="grow"><h2>' + esc(judul) + '</h2><div class="hello">' + esc(sub) + '</div></div><button class="iconbtn" data-act="cari" aria-label="Cari">' + ico('search') + '</button><button class="iconbtn" data-act="bell" aria-label="Pemberitahuan">' + ico('bell') + (n ? '<span class="dot"></span>' : '') + '</button><button class="iconbtn hide-m" data-act="bantuan" aria-label="Bantuan">' + ico('help') + '</button><a href="#/profil" aria-label="Profil">' + Ui.avatar(S.me.nama, 's') + '</a>';
    },
    notif: function () {
      var out = [], b = S.boot; if (!b) return out;
      if (S.me.role === 'admin' || S.me.role === 'pengajar') {
        (b.antreanNilai || []).slice(0, 5).forEach(function (a) { out.push({ ico: 'clipboard', t: a.peserta_nama + ' mengumpulkan ' + a.tugas_judul, s: a.kelas_nama + ' · ' + Wkt.rel(a.waktu), h: '#/penilaian/' + a.id }); });
        (b.pasif || []).slice(0, 3).forEach(function (p) { out.push({ ico: 'alert', t: p.nama + ' belum aktif ' + (p.hari > 999 ? '(belum mulai)' : p.hari + ' hari'), s: 'Peserta pasif', h: '#/laporan' }); });
      } else { var d = K.D(); if (d) { K.tenggat(d).filter(function (x) { return x.sisa < 3; }).slice(0, 5).forEach(function (x) { out.push({ ico: 'clock', t: 'Tenggat ' + x.t.judul, s: P.dayLabel(x.sisa, x.t.tenggat)[0] + ' · ' + x.k.nama, h: S.me.role === 'peserta' ? '#/ruang/' + x.p.id : '#/' }); }); K.nilaiTerbaru(d).slice(0, 2).forEach(function (x) { out.push({ ico: 'star', t: 'Nilai baru: ' + x.t.judul, s: x.c.status === 'revisi' ? 'Perlu revisi' : Math.round(x.c.nilai) + '/100', h: '#/' }); }); } }
      return out;
    }
  };
  window.App = App;

  /* ---------- ROUTER & RENDER ---------- */
  var pending = false;
  function typing() { var a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && $('view').contains(a)); }
  var lastRoute = '';
  Ui.render = function () {
    if (!S.me || !S.boot || $('app').hidden) return;
    K.dirty();
    var p = parts(), name = p[0] || 'dashboard', view = $('view');
    if (!boleh(p[0] || '')) { location.hash = '#/'; return; }
    var same = lastRoute === location.hash, y = window.scrollY;
    document.body.classList.toggle('sd', K.sd());
    var html;
    try { html = Ui.pilihHalaman(name, p); } catch (e) { console.error(e); html = '<div class="card">' + Ui.empty('alert', 'Terjadi kesalahan saat menampilkan halaman ini.', '<div class="mt8"><button class="btn sm" onclick="location.reload()">Muat ulang</button></div>') + '</div>'; }
    view.innerHTML = html; lastRoute = location.hash;
    App.topbar(p);
    document.querySelectorAll('[data-nav]').forEach(function (a) { var k = a.dataset.nav, on = k === name || (name === 'ruang' && k === 'kelas') || (k === 'dashboard' && name === 'dashboard'); a.classList.toggle('on', on); });
    $('side').classList.remove('open'); $('scrim').classList.remove('on');
    window.scrollTo(0, same ? y : 0);
  };
  Ui.pilihHalaman = function (name, p) {
    switch (name) {
      case 'dashboard': return Pages.dashboard();
      case 'kelas': return p[1] ? Pages.kelasDetail(p) : Pages.kelasList();
      case 'jalur': return Pages.jalurList();
      case 'pertemuan': return p[1] ? Pages.pertemuanDetail(p) : Pages.pertemuanList();
      case 'penilaian': return Pages.penilaian(p);
      case 'pengguna': return Pages.pengguna();
      case 'notifikasi': return Pages.notifikasi();
      case 'laporan': return Pages.laporan();
      case 'pengaturan': return Pages.pengaturan();
      case 'profil': return Pages.profil();
      case 'ruang': return Pages.ruang(p);
      case 'tugas': return Pages.tugasSaya();
      default: return Pages.dashboard();
    }
  };
  Ui.safeRender = function () { if (Ui.isModalOpen() || typing()) { pending = true; return; } pending = false; Ui.render(); };
  Ui.flush = function () { if (pending && !Ui.isModalOpen() && !typing()) { pending = false; Ui.render(); } };
  document.addEventListener('focusout', function () { setTimeout(Ui.flush, 80); });
  window.addEventListener('hashchange', function () { if (S.me) Ui.render(); });

  /* ---------- AKSI GLOBAL ---------- */
  Acts.modalX = function () { Ui.closeModal(); };
  Acts.logout = function () { App.logout(); };
  Acts.bukaSide = function (el, e) { if (e) e.preventDefault(); $('side').classList.add('open'); $('scrim').classList.add('on'); };
  Acts.miniSide = function () { var s = $('side'); s.classList.toggle('mini'); try { localStorage.setItem('lms_mini', s.classList.contains('mini') ? '1' : '0'); } catch (e) { } };
  Acts.loginBantuan = function () { Ui.modal({ title: 'Butuh bantuan masuk?', body: '<p>Gunakan <b>email</b> yang didaftarkan admin dan <b>kode akses</b> yang diberikan kepada Anda.</p><ul style="padding-left:18px;color:var(--ink2)"><li>Lupa kode akses? Minta admin membuat kode baru.</li><li>Gagal 5 kali berturut-turut? Tunggu 15 menit lalu coba lagi.</li><li>Orang tua: gunakan akun yang dibuat admin untuk Anda.</li></ul>', foot: '<button class="btn" data-act="modalX">Mengerti</button>' }); };
  Acts.loginDarurat = function () { var d = $('lf-dar'), s = $('lf-std'); d.hidden = !d.hidden; s.hidden = !d.hidden; $('lf-err').textContent = ''; };
  Acts.bell = function () { var l = App.notif(); Ui.modal({ title: 'Pemberitahuan', body: l.length ? l.map(function (x) { return '<a class="lrow click" href="' + esc(x.h) + '" data-act="modalX"><span class="ibox">' + ico(x.ico) + '</span><div class="grow"><div class="t">' + esc(x.t) + '</div><div class="s">' + esc(x.s) + '</div></div></a>'; }).join('') : Ui.empty('circleCheck', 'Tidak ada pemberitahuan baru.'), foot: '<button class="btn" data-act="modalX">Tutup</button>' }); };
  Acts.bantuan = function () {
    var T = { admin: ['Buat akun di menu <b>Pengguna</b> (atau Impor CSV).', 'Buat <b>Kelas</b>, tetapkan pengajar, tambahkan peserta.', 'Susun pertemuan dan prasyarat di detail kelas.', 'Pantau di <b>Dashboard</b> dan <b>Laporan</b>.'], pengajar: ['Buka <b>Kelas</b> Anda, tambahkan pertemuan, materi, dan tugas.', 'Atur urutan dengan seret kartu; atur prasyarat di panel kanan.', 'Nilai pengumpulan di <b>Tugas & Penilaian</b>.', 'Lihat peserta pasif di Dashboard.'], peserta: ['Mulai dari kartu <b>Langkah berikutnya</b> di Beranda.', 'Pertemuan terkunci akan terbuka setelah prasyaratnya selesai.', 'Kumpulkan tugas di Ruang Pertemuan, lalu tandai selesai.', 'Cek nilai dan umpan balik di <b>Tugas & Nilai</b>.'], ortu: ['Pilih nama anak di bagian atas (bila lebih dari satu).', 'Lihat progres, tenggat, dan nilai.', 'Akun orang tua hanya bisa melihat, tidak bisa mengubah.', 'Hubungi pengajar bila ada pertanyaan.'] };
    Ui.modal({ title: 'Panduan Singkat', body: '<ol style="padding-left:20px;display:flex;flex-direction:column;gap:8px">' + T[S.me.role].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>', foot: '<button class="btn" data-act="modalX">Mengerti</button>' });
  };
  Acts.cari = function () { Ui.modal({ title: 'Cari', body: '<div class="iw"><span>' + ico('search', 18) + '</span><input class="inp" id="cr-q" placeholder="Cari kelas, pertemuan' + (S.me.role === 'admin' ? ', pengguna' : '') + '" data-in="cariQ" autocomplete="off"></div><div id="cr-hasil">' + Ui.empty('search', 'Ketik untuk mencari.') + '</div>' }); };
  Acts.cariQ = Ui.debounce(function (el) {
    var q = el.value.trim().toLowerCase(), d = K.D(), X = K.ix(d), out = []; if (!q) { $('cr-hasil').innerHTML = Ui.empty('search', 'Ketik untuk mencari.'); return; }
    (d.kelas || []).forEach(function (k) { if (k.nama.toLowerCase().indexOf(q) > -1) out.push(['school', k.nama, 'Kelas', '#/kelas/' + k.id]); });
    (d.pertemuan || []).forEach(function (p) { if (p.judul.toLowerCase().indexOf(q) > -1 && X.kelas[p.kelas_id]) out.push(['video', p.judul, 'Pertemuan · ' + X.kelas[p.kelas_id].nama, (S.me.role === 'peserta' || S.me.role === 'ortu' ? '#/ruang/' : '#/pertemuan/') + p.id]); });
    if (S.me.role === 'admin') (d.users || []).forEach(function (u) { if ((u.nama + ' ' + u.email).toLowerCase().indexOf(q) > -1) out.push(['user', u.nama, Ui.ROLE_L[u.role] + ' · ' + u.email, '#/pengguna']); });
    $('cr-hasil').innerHTML = out.length ? out.slice(0, 12).map(function (r) { return '<a class="lrow click" href="' + esc(r[3]) + '" data-act="modalX"><span class="ibox">' + ico(r[0]) + '</span><div class="grow"><div class="t trunc">' + esc(r[1]) + '</div><div class="s trunc">' + esc(r[2]) + '</div></div></a>'; }).join('') : Ui.empty('search', 'Tidak ada hasil.');
  }, 120);

  /* ---------- DELEGASI EVENT ---------- */
  document.addEventListener('click', function (e) {
    var ov = $('overlay'); if (e.target === ov) { Ui.closeModal(); return; }
    var nav = e.target.closest('.side .nav a, .bnav a[data-nav]'); if (nav) { $('side').classList.remove('open'); $('scrim').classList.remove('on'); }
    if (e.target === $('scrim')) { $('side').classList.remove('open'); $('scrim').classList.remove('on'); return; }
    var row = e.target.closest('tr[data-href]'); if (row && !e.target.closest('button,a,input,select,label')) { location.hash = row.dataset.href; return; }
    var el = e.target.closest('[data-act]'); if (!el) return;
    var fn = Acts[el.dataset.act]; if (fn) { if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('input', function (e) { var el = e.target.closest && e.target.closest('[data-in]'); if (el && Acts[el.dataset.in]) Acts[el.dataset.in](el, e); });
  document.addEventListener('change', function (e) { var el = e.target.closest && e.target.closest('[data-ch]'); if (el && Acts[el.dataset.ch]) Acts[el.dataset.ch](el, e); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && Ui.isModalOpen()) Ui.closeModal(); });
  // seret-lepas file ke area unggah
  document.addEventListener('dragover', function (e) { var z = e.target.closest && e.target.closest('.dz'); if (z) { e.preventDefault(); z.classList.add('over'); } });
  document.addEventListener('dragleave', function (e) { var z = e.target.closest && e.target.closest('.dz'); if (z) z.classList.remove('over'); });
  document.addEventListener('drop', function (e) { var z = e.target.closest && e.target.closest('.dz'); if (!z || !e.dataTransfer || !e.dataTransfer.files.length) return; e.preventDefault(); var inp = z.querySelector('input[type=file]'); if (inp) { inp.files = e.dataTransfer.files; inp.dispatchEvent(new Event('change', { bubbles: true })); } });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && S.me) Sync.check(); });

  Api.onAuth = function (msg) { if (S.me) { K.clear(); App.showLogin(msg || 'Sesi berakhir. Silakan masuk kembali.'); } };

  /* ---------- MULAI ---------- */
  function init() {
    Api.warm('boot');
    if (K.load()) { App.masuk(); Sync.check(true); }
    else App.showLogin();
    $('boot').hidden = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
