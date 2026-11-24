/** store.js — State aplikasi, indeks data, aturan akses pertemuan, sinkronisasi latar belakang, dan helper aksi optimistik.
 *  Seluruh data satu peran dimuat sekali (boot) lalu dilayani dari memori: pindah menu = tanpa menunggu server. */
(function () {
  var LSK = 'lms_sess_v2';
  var S = { me: null, boot: null, nilai: null, nilaiVer: null, lap: null, lapVer: null, anakId: null, writing: 0 };
  var IX = new WeakMap();

  function by(arr, key) { var m = {}; (arr || []).forEach(function (r) { m[r[key]] = r; }); return m; }
  function group(arr, key) { var m = {}; (arr || []).forEach(function (r) { (m[r[key]] = m[r[key]] || []).push(r); }); return m; }

  /** Indeks dataset (admin/pengajar/peserta/anak). Dibangun sekali per objek data. */
  function ix(d) {
    var c = IX.get(d); if (c) return c;
    c = { kelas: by(d.kelas, 'id'), jalur: by(d.jalur, 'id'), pt: by(d.pertemuan, 'id'), tugas: by(d.tugas, 'id'), users: by(d.users, 'id') };
    c.ptByKelas = group(d.pertemuan, 'kelas_id');
    Object.keys(c.ptByKelas).forEach(function (k) { c.ptByKelas[k].sort(function (a, b) { return a.urutan - b.urutan; }); });
    c.tugasByPt = group(d.tugas, 'pertemuan_id'); c.materiByPt = group(d.materi, 'pertemuan_id');
    c.syarat = {}; (d.prasyarat || []).forEach(function (r) { (c.syarat[r.pertemuan_id] = c.syarat[r.pertemuan_id] || []).push(r.prasyarat_id); });
    c.angByKelas = {}; c.kelasByPeserta = {};
    (d.keanggotaan || []).forEach(function (a) { (c.angByKelas[a.kelas_id] = c.angByKelas[a.kelas_id] || []).push(a.peserta_id); (c.kelasByPeserta[a.peserta_id] = c.kelasByPeserta[a.peserta_id] || []).push(a.kelas_id); });
    c.prog = {}; (d.progres || []).forEach(function (r) { c.prog[r.pertemuan_id] = r; });
    c.kmpByTugas = group(d.pengumpulan, 'tugas_id');
    Object.keys(c.kmpByTugas).forEach(function (k) { c.kmpByTugas[k].sort(function (a, b) { return a.versi - b.versi; }); });
    IX.set(d, c); return c;
  }

  var K = {
    S: S, ix: ix, by: by,
    dirty: function () { IX.delete(S.boot); var d = K.D(); if (d) IX.delete(d); },
    D: function () {
      var b = S.boot; if (!b) return null;
      if (S.me.role === 'ortu') { var a = b.anak || []; return a.find(function (x) { return x.user.id === S.anakId; }) || a[0] || null; }
      return b;
    },
    jenjangNama: function (id) { var j = (S.boot.jenjang || []).find(function (x) { return x.id === id; }); return j ? j.nama : '-'; },
    jenjangMode: function (id) { var j = (S.boot.jenjang || []).find(function (x) { return x.id === id; }); return j ? j.mode : 'standar'; },
    mode: function () {
      if (!S.me) return 'standar';
      if (S.me.role === 'peserta') return K.jenjangMode(S.me.jenjang_id);
      if (S.me.role === 'ortu') { var d = K.D(); return d ? K.jenjangMode(d.user.jenjang_id) : 'standar'; }
      return 'standar';
    },
    sd: function () { return K.mode() === 'sd'; },
    userNama: function (id) { var u = ix(S.boot).users[id]; return u ? u.nama : '-'; },
    app: function () { return (S.boot && S.boot.app) || {}; },
    namaApp: function () { return K.app().NAMA_APP || CFG.NAMA_APP; },

    /** Aturan akses pertemuan untuk peserta — sama persis dengan server (Lms.gs: statusAkses_). */
    akses: function (d, p) {
      var X = ix(d), pr = X.prog[p.id];
      if (pr && pr.status === 'selesai') return 'selesai';
      var s = X.syarat[p.id] || [];
      for (var i = 0; i < s.length; i++) { var q = X.prog[s[i]]; if (!q || q.status !== 'selesai') return 'terkunci'; }
      if (p.buka && p.buka > Wkt.now()) return 'belum_buka';
      return 'dibuka';
    },
    /** Ringkasan satu kelas dari sudut pandang peserta. */
    progKelas: function (d, kelasId) {
      var X = ix(d), pts = (X.ptByKelas[kelasId] || []).filter(function (p) { return p.status !== 'draf'; }), sel = 0, next = null;
      var nodes = pts.map(function (p) { var st = K.akses(d, p); if (st === 'selesai') sel++; else if (!next && st === 'dibuka') next = p; return { p: p, st: st }; });
      return { total: pts.length, selesai: sel, pct: pts.length ? Math.round(sel / pts.length * 100) : 0, next: next, nodes: nodes };
    },
    kmpTerakhir: function (d, tugasId) { var l = ix(d).kmpByTugas[tugasId]; return l && l.length ? l[l.length - 1] : null; },
    tugasStatus: function (d, t) { var c = K.kmpTerakhir(d, t.id); return c ? c.status : 'belum'; },
    /** Tenggat terdekat: tugas pada pertemuan yang terbuka dan belum dikumpul. */
    tenggat: function (d) {
      var X = ix(d), out = [];
      (d.tugas || []).forEach(function (t) {
        var p = X.pt[t.pertemuan_id]; if (!p || K.akses(d, p) !== 'dibuka' || K.kmpTerakhir(d, t.id) || !t.tenggat) return;
        out.push({ t: t, p: p, k: X.kelas[p.kelas_id], sisa: Wkt.selisihHari(t.tenggat) });
      });
      return out.sort(function (a, b) { return a.sisa - b.sisa; });
    },
    nilaiTerbaru: function (d) {
      var X = ix(d), out = [];
      (d.tugas || []).forEach(function (t) { var c = K.kmpTerakhir(d, t.id); if (c && (c.status === 'dinilai' || c.status === 'revisi')) out.push({ c: c, t: t, p: X.pt[t.pertemuan_id] }); });
      return out.sort(function (a, b) { return (b.c.dinilai_pada || '') > (a.c.dinilai_pada || '') ? 1 : -1; });
    },
    /** Prasyarat melingkar? (dipakai untuk validasi cepat di browser; server tetap memeriksa ulang). */
    butuh: function (X, dari, target, seen) {
      seen = seen || {}; if (dari === target) return true; if (seen[dari]) return false; seen[dari] = 1;
      return (X.syarat[dari] || []).some(function (n) { return K.butuh(X, n, target, seen); });
    },

    /* ---------- Sesi & penyimpanan lokal ---------- */
    save: function () { try { localStorage.setItem(LSK, JSON.stringify({ t: Api.token, me: S.me, boot: S.boot, anak: S.anakId, at: Date.now() })); } catch (e) { } },
    load: function () {
      try { var j = JSON.parse(localStorage.getItem(LSK) || 'null'); if (!j || !j.t || !j.boot || !j.me) return false; Api.token = j.t; S.me = j.me; S.boot = j.boot; S.anakId = j.anak; return true; } catch (e) { return false; }
    },
    clear: function () { try { localStorage.removeItem(LSK); } catch (e) { } Api.token = null; S.me = null; S.boot = null; S.nilai = null; S.lap = null; S.anakId = null; },
    setSesi: function (token, me, boot) { Api.token = token; S.me = me; S.boot = boot; S.nilai = null; S.lap = null; S.anakId = null; K.save(); },
    /** Ganti isi data di tempat (objek S.boot tetap sama) agar handler yang sedang berjalan tidak memegang data basi. */
    setBoot: function (b) {
      if (S.boot && S.boot !== b) { Object.keys(S.boot).forEach(function (k) { delete S.boot[k]; }); Object.assign(S.boot, b); } else S.boot = b;
      K.dirty(); K.save();
    },

    /** Aksi optimistik: ubah tampilan dulu → kirim → batalkan bila gagal. */
    aksi: async function (action, data, o) {
      o = o || {};
      if (o.opt) o.opt();
      if (o.opt && o.render !== false) Ui.render();
      if (o.btn) Ui.sibuk(o.btn, true, o.label);
      S.writing++;
      var r;
      try { r = await Api.call(action, data, { write: true }); } finally { S.writing--; }
      if (o.btn) Ui.sibuk(o.btn, false);
      if (!r.success) { if (o.undo) o.undo(); Ui.render(); Ui.toast(r.message || 'Gagal menyimpan.', 'err'); return null; }
      if (o.ok) o.ok(r.data);
      K.save(); Ui.render();
      if (r.message && o.toast !== false) Ui.toast(r.message, 'ok');
      Sync.soon();
      return r;
    }
  };

  /* ---------- Sinkronisasi latar belakang (SWR) ---------- */
  var Sync = {
    timer: null, busy: false, soonT: null,
    start: function () { this.stop(); var self = this; this.timer = setInterval(function () { if (!document.hidden) self.check(); }, (CFG.POLL_DETIK || 45) * 1000); },
    stop: function () { clearInterval(this.timer); this.timer = null; },
    soon: function (ms) { var self = this; clearTimeout(this.soonT); this.soonT = setTimeout(function () { self.check(true); }, ms || 1800); },
    check: async function (force) {
      if (this.busy || S.writing > 0 || !S.me || !Api.token) return;
      this.busy = true;
      try {
        var v = await Api.call('ver', {});
        if (!v.success) return;
        if (force || v.data.g !== S.boot.versi) {
          var b = await Api.call('boot', {});
          if (b.success && S.writing === 0) { S.me = b.data.me; K.setBoot(b.data.boot); Ui.safeRender(); if (S.nilai || S.lap) Sync.muatBerat(); }
        }
      } finally { this.busy = false; }
    },
    /** Muat daftar penilaian & laporan (admin/pengajar) — sekali jalan lewat batch. */
    muatBerat: async function (butuh) {
      if (!S.me || (S.me.role !== 'admin' && S.me.role !== 'pengajar')) return;
      var calls = [], ver = S.boot.versi;
      if (butuh !== 'lap' && S.nilaiVer !== ver) calls.push('nilai.daftar');
      if (butuh !== 'nilai' && S.lapVer !== ver) calls.push('laporan.data');
      if (!calls.length) return;
      var r = await Api.call('batch', { calls: calls.map(function (a) { return { action: a }; }) });
      if (!r.success) return;
      calls.forEach(function (a, i) {
        var x = r.data[i]; if (!x || !x.success) return;
        if (a === 'nilai.daftar') { S.nilai = x.data; S.nilaiVer = ver; } else { S.lap = x.data; S.lapVer = ver; }
      });
      Ui.safeRender();
    }
  };

  window.S = S; window.K = K; window.Sync = Sync;
})();
