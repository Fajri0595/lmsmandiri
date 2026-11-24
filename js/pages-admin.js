/** pages-admin.js — Pengguna (+impor CSV), Pengaturan, Notifikasi (tahap 2), Profil. */

/* =================== PENGGUNA =================== */
Pages.pengguna = function () {
  var b = S.boot; V.usr = V.usr || { q: '', role: '', status: '', page: 1 };
  var kanan = '<button class="btn sec" data-act="impForm">' + ico('upload', 16) + ' Impor CSV</button><button class="btn" data-act="userForm">' + ico('plus', 16) + ' Tambah Pengguna</button>';
  return P.head('Pengguna', 'Kelola akun peserta, pengajar, orang tua, dan admin.', kanan) +
    '<div class="card flush"><div class="toolbar"><div class="iw grow" style="min-width:200px"><span>' + ico('search', 18) + '</span><input class="inp" placeholder="Cari nama atau email" value="' + esc(V.usr.q) + '" data-in="usrQ"></div><select class="sel sm" data-ch="usrF" data-k="role">' + Ui.opt([['admin', 'Admin'], ['pengajar', 'Pengajar'], ['peserta', 'Peserta'], ['ortu', 'Orang Tua']], 0, 1, V.usr.role, 'Semua peran') + '</select><select class="sel sm" data-ch="usrF" data-k="status">' + Ui.opt([['aktif', 'Aktif'], ['nonaktif', 'Nonaktif']], 0, 1, V.usr.status, 'Semua status') + '</select></div><div id="usr-tbl">' + Pages.usrTbl() + '</div></div>';
};
Pages.usrTbl = function () {
  var b = S.boot, f = V.usr, q = f.q.toLowerCase();
  var rows = b.users.filter(function (u) { return (!f.role || u.role === f.role) && (!f.status || u.status === f.status) && (!q || (u.nama + ' ' + u.email).toLowerCase().indexOf(q) > -1); });
  var pg = Ui.slice(rows, f.page, 10);
  if (!rows.length) return Ui.empty('users', 'Tidak ada pengguna yang cocok.');
  return '<div class="tw"><table class="tbl"><thead><tr><th>Pengguna</th><th>Peran</th><th class="hide-m">Jenjang</th><th class="hide-m">WhatsApp</th><th class="hide-m">Aktif terakhir</th><th>Status</th><th></th></tr></thead><tbody>' + pg.map(function (u) {
    return '<tr><td><div class="row">' + Ui.avatar(u.nama, 's') + '<div><div class="b">' + esc(u.nama) + '</div><div class="sm mute">' + esc(u.email) + '</div></div></div></td><td><span class="pill">' + esc(Ui.ROLE_L[u.role]) + '</span></td><td class="hide-m">' + (u.jenjang_id ? esc(K.jenjangNama(u.jenjang_id)) : '-') + '</td><td class="hide-m">' + esc(u.no_wa || '-') + '</td><td class="hide-m sm mute">' + esc(Wkt.rel(u.terakhir_aktif)) + '</td><td>' + Ui.badge(u.status) + '</td><td class="tr" style="white-space:nowrap"><button class="iconbtn" title="Ubah" data-act="userForm" data-id="' + esc(u.id) + '">' + ico('edit', 18) + '</button><button class="iconbtn" title="Buat kode akses baru" data-act="userReset" data-id="' + esc(u.id) + '">' + ico('key', 18) + '</button><button class="iconbtn" title="' + (u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan') + '" data-act="userStatus" data-id="' + esc(u.id) + '">' + ico(u.status === 'aktif' ? 'lock' : 'check', 18) + '</button></td></tr>';
  }).join('') + '</tbody></table></div>' + Ui.pager(rows.length, f.page, 10, 'usrPg');
};
Acts.usrQ = Ui.debounce(function (el) { V.usr.q = el.value; V.usr.page = 1; document.getElementById('usr-tbl').innerHTML = Pages.usrTbl(); }, 100);
Acts.usrF = function (el) { V.usr[el.dataset.k] = el.value; V.usr.page = 1; document.getElementById('usr-tbl').innerHTML = Pages.usrTbl(); };
Acts.usrPg = function (el) { V.usr.page = Number(el.dataset.p); document.getElementById('usr-tbl').innerHTML = Pages.usrTbl(); };

Acts.userForm = function (el) {
  var b = S.boot, id = el.dataset.id, u = id ? b.users.find(function (x) { return x.id === id; }) : { role: 'peserta' }, ortu = b.users.filter(function (x) { return x.role === 'ortu' && x.status === 'aktif'; });
  var self = id && id === S.me.id;
  var body = '<div class="fld"><label>Nama lengkap *</label><input class="inp" id="uf-nama" value="' + esc(u.nama || '') + '"></div><div class="fld"><label>Email *</label><input type="email" class="inp" id="uf-email" value="' + esc(u.email || '') + '" autocomplete="off"></div>' +
    '<div class="g g2" style="gap:12px"><div class="fld"><label>Peran *</label><select class="sel" id="uf-role" data-ch="ufRole"' + (self ? ' disabled' : '') + '>' + Ui.opt([['peserta', 'Peserta'], ['pengajar', 'Pengajar'], ['ortu', 'Orang Tua'], ['admin', 'Admin']], 0, 1, u.role) + '</select></div><div class="fld"><label>Jenjang</label><select class="sel" id="uf-jenjang">' + Ui.opt(b.jenjang, 'id', 'nama', u.jenjang_id, 'Tidak ada') + '</select></div></div>' +
    '<div class="fld"><label>Nomor WhatsApp</label><input class="inp" id="uf-wa" value="' + esc(u.no_wa || '') + '" placeholder="08xxxxxxxxxx" inputmode="tel"></div>' +
    '<div class="fld" id="uf-ortu-w"' + (u.role === 'peserta' ? '' : ' hidden') + '><label>Orang tua / wali</label><select class="sel" id="uf-ortu">' + Ui.opt(ortu, 'id', 'nama', u.ortu_id, 'Belum ditautkan') + '</select><span class="hint">Orang tua melihat progres anak (hanya baca).</span></div>' +
    (id ? '' : '<div class="callout info">' + ico('info', 18) + '<div>Kode akses awal dibuat otomatis dan hanya tampil sekali setelah disimpan.</div></div>');
  Ui.modal({ title: id ? 'Ubah Pengguna' : 'Tambah Pengguna', drawer: true, body: body, foot: '<button class="btn sec" data-act="modalX">Batal</button><button class="btn" data-act="userSimpan" data-id="' + esc(id || '') + '">Simpan</button>' });
};
Acts.ufRole = function (el) { document.getElementById('uf-ortu-w').hidden = el.value !== 'peserta'; };
Acts.userSimpan = async function (el) {
  var id = el.dataset.id, b = S.boot, role = F('uf-role') || (b.users.find(function (x) { return x.id === id; }) || {}).role;
  var data = { id: id || undefined, nama: F('uf-nama').trim(), email: F('uf-email').trim(), role: role, jenjang_id: F('uf-jenjang'), no_wa: F('uf-wa'), ortu_id: F('uf-ortu') };
  if (!data.nama) return Ui.toast('Nama wajib diisi.', 'err');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return Ui.toast('Format email tidak valid.', 'err');
  var r = await K.aksi('user.simpan', data, { btn: el, toast: !!id }); if (!r) return;
  if (id) b.users = b.users.map(function (x) { return x.id === id ? r.data.user : x; }); else b.users.push(r.data.user);
  K.dirty(); K.save(); Ui.closeModal(); Ui.render();
  if (r.data.kode) Pages.tampilKode(r.data.user.nama, r.data.user.email, r.data.kode);
};
Pages.tampilKode = function (nama, email, kode) {
  Ui.modal({ title: 'Kode Akses Pengguna', body: '<p>Berikan kode ini kepada <b>' + esc(nama) + '</b> (' + esc(email) + '). Kode <b>hanya tampil sekali</b> dan tidak bisa dilihat lagi.</p><div class="kode" id="kode-teks">' + esc(kode) + '</div><div class="callout">' + ico('alert', 18) + '<div>Sarankan pengguna mengganti kode ini di menu Profil setelah masuk pertama kali.</div></div>', foot: '<button class="btn sec" data-act="salin" data-t="' + esc(kode) + '">' + ico('copy', 16) + ' Salin kode</button><button class="btn" data-act="modalX">Selesai</button>' });
};
Acts.salin = function (el) { try { navigator.clipboard.writeText(el.dataset.t); Ui.toast('Tersalin.', 'ok'); } catch (e) { var r = document.createRange(); r.selectNodeContents(document.getElementById('kode-teks')); getSelection().removeAllRanges(); getSelection().addRange(r); Ui.toast('Tekan Ctrl+C untuk menyalin.', 'warn'); } };
Acts.userReset = async function (el) {
  var u = S.boot.users.find(function (x) { return x.id === el.dataset.id; });
  if (!await Ui.konfirmasi('Buat kode akses baru untuk ' + u.nama + '? Kode lama tidak berlaku lagi dan semua perangkatnya dikeluarkan.', 'Buat kode baru')) return;
  var r = await K.aksi('user.resetKode', { id: u.id }, { toast: false }); if (r) Pages.tampilKode(u.nama, u.email, r.data.kode);
};
Acts.userStatus = async function (el) {
  var b = S.boot, u = b.users.find(function (x) { return x.id === el.dataset.id; }), baru = u.status === 'aktif' ? 'nonaktif' : 'aktif';
  if (baru === 'nonaktif' && !await Ui.konfirmasi('Nonaktifkan ' + u.nama + '? Pengguna tidak bisa masuk sampai diaktifkan kembali.', 'Nonaktifkan', true)) return;
  var lama = u.status; K.aksi('user.status', { id: u.id, status: baru }, { opt: function () { u.status = baru; }, undo: function () { u.status = lama; } });
};

/* ---------- Impor CSV ---------- */
var CSV_TEMPLATE = 'nama,email,peran,jenjang,no_wa,ortu_email\nAisyah Putri,aisyah@contoh.id,peserta,SD,081234567890,ibu.aisyah@contoh.id\nBudi Santoso,budi@contoh.id,pengajar,,081298765432,\n';
Acts.impForm = function () {
  V.imp = { rows: [] };
  Ui.modal({ title: 'Impor Pengguna dari CSV', size: 'lg', body: '<p class="ink2">Unggah file CSV berisi kolom: <b>nama, email, peran, jenjang, no_wa, ortu_email</b>. Peran: peserta / pengajar / ortu / admin. Kode akses dibuat otomatis per pengguna.</p><div class="row wrap gap8"><button class="btn soft sm" data-act="impTemplate">' + ico('download', 14) + ' Unduh templat CSV</button></div><div class="dz" data-act="impPilih"><input type="file" id="imp-file" accept=".csv,text/csv" hidden data-ch="impFile">' + ico('upload', 26) + '<div class="b" id="imp-nama" style="margin-top:6px">Klik untuk memilih file CSV</div></div><div id="imp-prev"></div>', foot: '<button class="btn sec" data-act="modalX">Tutup</button><button class="btn" id="imp-go" data-act="impMulai" disabled>Mulai impor</button>' });
};
Acts.impTemplate = function () { Ui.unduhBlob('templat-pengguna.csv', new Blob(['\ufeff' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })); };
Acts.impPilih = function () { document.getElementById('imp-file').click(); };
Acts.impFile = async function (el) {
  var f = el.files[0]; if (!f) return; if (f.size > 2 * 1048576) return Ui.toast('File CSV terlalu besar (maks 2 MB).', 'err');
  var txt = await f.text(), tbl = Ui.parseCsv(txt); if (tbl.length < 2) return Ui.toast('CSV kosong atau tidak berisi data.', 'err');
  var map = { nama: 'nama', name: 'nama', email: 'email', 'e-mail': 'email', peran: 'role', role: 'role', jenjang: 'jenjang', no_wa: 'no_wa', wa: 'no_wa', hp: 'no_wa', telepon: 'no_wa', ortu_email: 'ortu_email' };
  var head = tbl[0].map(function (h) { return map[h.trim().toLowerCase()] || ''; });
  if (head.indexOf('nama') < 0 || head.indexOf('email') < 0) return Ui.toast('Kolom "nama" dan "email" wajib ada di baris pertama.', 'err');
  V.imp.rows = tbl.slice(1).map(function (r) { var o = {}; head.forEach(function (h, i) { if (h) o[h] = (r[i] || '').trim(); }); return o; }).filter(function (o) { return o.nama || o.email; });
  document.getElementById('imp-nama').textContent = f.name + ' — ' + V.imp.rows.length + ' baris';
  document.getElementById('imp-prev').innerHTML = '<div class="tw mt16"><table class="tbl"><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Jenjang</th></tr></thead><tbody>' + V.imp.rows.slice(0, 5).map(function (r) { return '<tr><td>' + esc(r.nama) + '</td><td>' + esc(r.email) + '</td><td>' + esc(r.role || 'peserta') + '</td><td>' + esc(r.jenjang || '-') + '</td></tr>'; }).join('') + '</tbody></table></div>' + (V.imp.rows.length > 5 ? '<div class="sm mute mt8">… dan ' + (V.imp.rows.length - 5) + ' baris lainnya</div>' : '');
  document.getElementById('imp-go').disabled = !V.imp.rows.length;
};
Acts.impMulai = async function (el) {
  var rows = V.imp.rows, hasil = [], lewat = [], CH = 100; Ui.sibuk(el, true, 'Mengimpor...');
  for (var i = 0; i < rows.length; i += CH) {
    var part = rows.slice(i, i + CH), r = await Api.call('user.import', { rows: part }, { write: true, timeout: 120000 });
    if (!r.success) { Ui.sibuk(el, false); return Ui.toast(r.message || 'Impor gagal.', 'err'); }
    hasil = hasil.concat(r.data.dibuat); lewat = lewat.concat(r.data.dilewati.map(function (x) { return { baris: x.baris + i, email: x.email, alasan: x.alasan }; }));
    document.getElementById('imp-nama').textContent = 'Memproses ' + Math.min(i + CH, rows.length) + ' / ' + rows.length + '...';
  }
  V.imp.hasil = hasil; Sync.soon(500); Sync.check(true);
  document.getElementById('imp-prev').innerHTML = '<div class="callout ' + (hasil.length ? 'info' : '') + ' mt16">' + ico('circleCheck', 18) + '<div><b>' + hasil.length + ' pengguna ditambahkan</b>' + (lewat.length ? ', ' + lewat.length + ' dilewati.' : '.') + ' Kode akses hanya tampil sekali — unduh daftarnya sekarang.</div></div>' + (hasil.length ? '<button class="btn mt16" data-act="impKode">' + ico('download', 16) + ' Unduh daftar kode akses (CSV)</button>' : '') + (lewat.length ? '<div class="tw mt16"><table class="tbl"><thead><tr><th>Baris</th><th>Email</th><th>Alasan dilewati</th></tr></thead><tbody>' + lewat.slice(0, 30).map(function (x) { return '<tr><td>' + x.baris + '</td><td>' + esc(x.email) + '</td><td>' + esc(x.alasan) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '');
  Ui.sibuk(el, false); el.hidden = true; document.getElementById('imp-nama').textContent = 'Selesai';
};
Acts.impKode = function () { Ui.unduhBlob('kode-akses-pengguna.csv', new Blob([Ui.toCsv(['nama', 'email', 'peran', 'kode_akses'], V.imp.hasil.map(function (h) { return [h.nama, h.email, h.role, h.kode]; }))], { type: 'text/csv;charset=utf-8' })); };

/* =================== PENGATURAN =================== */
Pages.pengaturan = function () {
  var a = K.app();
  return P.head('Pengaturan', 'Atur identitas aplikasi dan aturan dasar unggahan.') +
    '<div class="g g2"><section class="card"><div class="chead"><span class="ibox">' + ico('settings') + '</span><h2 class="grow">Umum</h2></div><div class="col"><div class="fld"><label>Nama aplikasi</label><input class="inp" id="st-nama" value="' + esc(a.NAMA_APP) + '" maxlength="60"></div><div class="fld"><label>Nama lembaga / program</label><input class="inp" id="st-inst" value="' + esc(a.INSTANSI || '') + '" maxlength="80"></div><div class="fld"><label>Peserta dianggap pasif setelah (hari)</label><input type="number" min="1" max="90" class="inp" id="st-hari" value="' + esc(a.HARI_PASIF) + '"></div></div></section>' +
    '<section class="card"><div class="chead"><span class="ibox amb">' + ico('upload') + '</span><h2 class="grow">Aturan File Tugas</h2></div><div class="col"><div class="fld"><label>Batas ukuran bawaan (MB, maks 10)</label><input type="number" min="1" max="10" class="inp" id="st-mb" value="' + esc(a.MAKS_MB_BAWAAN) + '"><span class="hint">Batas 10 MB berasal dari ketentuan Apps Script. File lebih besar dikumpulkan lewat tautan Drive.</span></div><div class="fld"><label>Format bawaan (pisahkan koma)</label><input class="inp" id="st-fmt" value="' + esc(a.FORMAT_BAWAAN) + '"></div></div></section></div>' +
    '<div class="row mt24"><button class="btn" data-act="setSimpan">' + ico('check', 16) + ' Simpan pengaturan</button></div>' +
    '<section class="card mt24"><div class="chead"><span class="ibox">' + ico('info') + '</span><h2 class="grow">Informasi Sistem</h2></div><div class="g g3 sm"><div><div class="mute">Versi data</div><div class="b trunc">' + esc(String(S.boot.versi || '-').slice(-8)) + '</div></div><div><div class="mute">Sinkronisasi</div><div class="b">Otomatis tiap ' + (CFG.POLL_DETIK || 45) + ' detik</div></div><div><div class="mute">Notifikasi WA & Email</div><div class="b">Tahap 2</div></div></div></section>';
};
Acts.setSimpan = async function (el) {
  var nilai = { NAMA_APP: F('st-nama').trim(), INSTANSI: F('st-inst').trim(), HARI_PASIF: F('st-hari'), MAKS_MB_BAWAAN: F('st-mb'), FORMAT_BAWAAN: F('st-fmt').trim() };
  if (!nilai.NAMA_APP) return Ui.toast('Nama aplikasi wajib diisi.', 'err');
  var r = await K.aksi('setting.simpan', { nilai: nilai }, { btn: el }); if (!r) return;
  Object.assign(S.boot.app, r.data); document.title = r.data.NAMA_APP; K.save(); Ui.render(); App.shell();
};

/* =================== NOTIFIKASI (TAHAP 2) =================== */
Pages.notifikasi = function () {
  var kartu = [['mail', 'Template Pesan', 'Tulis template WhatsApp dan Email dengan variabel {nama}, {kelas}, {tenggat}.'], ['route', 'Alur CRM', 'Onboarding, pengingat tenggat, re-engagement peserta pasif, dan follow-up kelulusan.'], ['filetext', 'Log Notifikasi', 'Pantau terkirim/gagal, kirim ulang, dan opt-out per penerima.']];
  return P.head('Notifikasi WhatsApp & Email CRM', 'Modul ini dibangun pada tahap 2.') + '<div class="callout info mb">' + ico('info', 18) + '<div><b>Sudah siap secara data.</b> Nomor WhatsApp, email, tautan orang tua, progres belajar, dan tenggat tugas sudah tersimpan — modul notifikasi tinggal memakainya sebagai pemicu.</div></div><div class="g g3">' + kartu.map(function (k) { return '<section class="card"><span class="ibox" style="margin-bottom:10px">' + ico(k[0]) + '</span><h3>' + k[1] + '</h3><p class="mute sm" style="margin:6px 0 10px">' + k[2] + '</p><span class="badge b-amb">Tahap 2</span></section>'; }).join('') + '</div>';
};

/* =================== PROFIL =================== */
Pages.profil = function () {
  var u = S.me, jn = u.jenjang_id ? K.jenjangNama(u.jenjang_id) : '-';
  return P.head('Profil', 'Kelola akun dan keamanan Anda.') +
    '<div class="g g2"><section class="card"><div class="row" style="margin-bottom:16px">' + Ui.avatar(u.nama, 'l') + '<div><h2>' + esc(u.nama) + '</h2><span class="pill">' + esc(Ui.ROLE_L[u.role]) + '</span></div></div><div class="col sm" style="gap:10px"><div class="row sp"><span class="mute">Email</span><b>' + esc(u.email) + '</b></div>' + (u.role !== 'admin' ? '<div class="row sp"><span class="mute">Jenjang</span><b>' + esc(jn) + '</b></div>' : '') + (u.no_wa ? '<div class="row sp"><span class="mute">WhatsApp</span><b>' + esc(u.no_wa) + '</b></div>' : '') + '</div><div class="row wrap mt24" style="gap:10px"><button class="btn sec" data-act="logout">' + ico('logout', 16) + ' Keluar</button><button class="btn gh" data-act="keluarSemua">Keluar dari semua perangkat</button></div></section>' +
    (u.id === 'darurat' ? '<section class="card"><div class="callout">' + ico('alert', 18) + '<div>Anda masuk dengan akses darurat. Buat akun admin biasa di menu Pengguna, lalu gunakan akun itu.</div></div></section>' : '<section class="card"><div class="chead"><span class="ibox">' + ico('key') + '</span><h2 class="grow">Ganti Kode Akses</h2></div><div class="col"><div class="fld"><label>Kode akses saat ini</label><input type="password" class="inp" id="pw-lama" autocomplete="current-password"></div><div class="fld"><label>Kode akses baru</label><input type="password" class="inp" id="pw-baru" autocomplete="new-password"><span class="hint">Minimal 8 karakter, memuat huruf dan angka.</span></div><div class="fld"><label>Ulangi kode baru</label><input type="password" class="inp" id="pw-ulang" autocomplete="new-password"></div><button class="btn" data-act="gantiKode">Simpan kode baru</button></div></section>') + '</div>';
};
Acts.gantiKode = async function (el) {
  var lama = F('pw-lama'), baru = F('pw-baru'), ulang = F('pw-ulang');
  if (!lama) return Ui.toast('Isi kode akses saat ini.', 'err');
  if (baru.length < 8 || !/[A-Za-z]/.test(baru) || !/\d/.test(baru)) return Ui.toast('Kode baru minimal 8 karakter dan memuat huruf serta angka.', 'err');
  if (baru !== ulang) return Ui.toast('Pengulangan kode baru tidak sama.', 'err');
  var r = await K.aksi('auth.gantiKode', { lama: lama, baru: baru }, { btn: el }); if (r) ['pw-lama', 'pw-baru', 'pw-ulang'].forEach(function (i) { document.getElementById(i).value = ''; });
};
Acts.keluarSemua = async function () { if (!await Ui.konfirmasi('Keluarkan akun ini dari semua perangkat, termasuk perangkat ini?', 'Keluarkan semua')) return; await Api.call('auth.keluarSemua', {}, { write: true }); Acts.logout(); };
