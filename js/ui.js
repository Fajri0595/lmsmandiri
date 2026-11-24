/** ui.js — Utilitas tampilan: format, komponen, grafik SVG, modal, toast, ekspor. Semua teks pengguna di-escape. */
(function () {
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- Waktu (string naif WIB 'yyyy-MM-dd HH:mm:ss', sama dengan server) ---------- */
  var Wkt = {
    nowMs: function () { return Date.now() + CFG.TZ_OFFSET_JAM * 3600e3; },
    now: function () { return new Date(this.nowMs()).toISOString().slice(0, 19).replace('T', ' '); },
    ms: function (ts) { return ts ? Date.parse(String(ts).replace(' ', 'T') + 'Z') : NaN; },
    tgl: function (ts) { if (!ts) return '-'; var m = this.ms(ts); if (isNaN(m)) return '-'; var d = new Date(m); return d.getUTCDate() + ' ' + BLN[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); },
    pendek: function (ts) { if (!ts) return '-'; var d = new Date(this.ms(ts)); return d.getUTCDate() + ' ' + BLN[d.getUTCMonth()]; },
    jam: function (ts) { return ts ? String(ts).slice(11, 16) : ''; },
    fmt: function (ts) { return ts ? this.tgl(ts) + ', ' + this.jam(ts) : '-'; },
    rel: function (ts) {
      if (!ts) return 'belum pernah';
      var s = (this.nowMs() - this.ms(ts)) / 1000;
      if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' mnt lalu';
      if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'; if (s < 2592000) return Math.floor(s / 86400) + ' hari lalu';
      return this.tgl(ts);
    },
    selisihHari: function (ts) { return (this.ms(ts) - this.nowMs()) / 86400e3; },
    toInp: function (ts) { return ts ? String(ts).slice(0, 16).replace(' ', 'T') : ''; },
    fromInp: function (v) { return v ? v.replace('T', ' ') + ':00' : ''; },
    salam: function () { var h = new Date(this.nowMs()).getUTCHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; },
    bln: BLN,
    blnLabel: function (key) { return BLN[Number(key.slice(5, 7)) - 1]; }
  };

  /* ---------- Komponen kecil ---------- */
  var WARNA = ['#2563eb', '#0891b2', '#16a34a', '#d97706', '#9333ea', '#db2777', '#0d9488', '#4f46e5'];
  function avatar(nama, cls) {
    nama = nama || '?'; var h = 0; for (var i = 0; i < nama.length; i++) h = (h * 31 + nama.charCodeAt(i)) >>> 0;
    var ini = nama.trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    return '<span class="avatar ' + (cls || '') + '" style="background:' + WARNA[h % WARNA.length] + '">' + esc(ini) + '</span>';
  }
  var BADGE = {
    aktif: ['b-ok', 'Aktif'], akan_datang: ['b-pri', 'Akan Datang'], draf: ['b-gray', 'Draf'], selesai: ['b-ok', 'Selesai'], arsip: ['b-amb', 'Arsip'], nonaktif: ['b-gray', 'Nonaktif'],
    terbit: ['b-pri', 'Terbit'], terkumpul: ['b-ok', 'Terkumpul'], terlambat: ['b-err', 'Terlambat'], dinilai: ['b-pri', 'Dinilai'], revisi: ['b-amb', 'Perlu Revisi'],
    terkunci: ['b-gray', 'Terkunci'], belum_buka: ['b-amb', 'Belum Dibuka'], dibuka: ['b-pri', 'Berjalan'], belum: ['b-gray', 'Belum Dikumpul']
  };
  function badge(st, label) { var b = BADGE[st] || ['b-gray', st]; return '<span class="badge ' + b[0] + '">' + esc(label || b[1]) + '</span>'; }
  var ROLE_L = { admin: 'Admin', pengajar: 'Pengajar', peserta: 'Peserta', ortu: 'Orang Tua' };
  function progress(p, ok) { p = Math.max(0, Math.min(100, Math.round(p || 0))); return '<div class="prog"><div class="bar' + (ok ? ' ok' : '') + '"><i style="width:' + p + '%"></i></div><span class="sm b">' + p + '%</span></div>'; }
  function empty(icon, msg, aksi) { return '<div class="empty">' + ico(icon || 'info', 44) + '<div>' + esc(msg) + '</div>' + (aksi || '') + '</div>'; }
  function skel(n, h) { var s = ''; for (var i = 0; i < (n || 3); i++) s += '<div class="skel" style="height:' + (h || 56) + 'px;margin-bottom:10px"></div>'; return s; }
  function opt(list, val, lab, sel, kosong) {
    return (kosong ? '<option value="">' + esc(kosong) + '</option>' : '') + list.map(function (x) { var v = typeof val === 'function' ? val(x) : x[val]; return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(typeof lab === 'function' ? lab(x) : x[lab]) + '</option>'; }).join('');
  }
  function ukuran(b) { b = Number(b) || 0; return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b + ' B'; }
  var JENIS_IKON = { pdf: 'filetext', dokumen: 'filetext', slide: 'slide', lembar: 'table', audio: 'music', video: 'video', gambar: 'image', kode: 'code', tautan: 'link', lainnya: 'file' };
  function jenisIkon(j) { return JENIS_IKON[j] || 'file'; }

  /* ---------- Grafik SVG ---------- */
  function nice(max) { if (max <= 5) return 5; var p = Math.pow(10, Math.floor(Math.log10(max))), n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function areaChart(o) {
    var W = 640, H = 270, L = 40, R = 10, T = 12, B = 28, n = o.labels.length, iw = W - L - R, ih = H - T - B;
    var max = nice(Math.max.apply(null, o.a.concat(o.b || [0], [1]))), x = function (i) { return L + (n === 1 ? iw / 2 : iw * i / (n - 1)); }, y = function (v) { return T + ih - ih * v / max; };
    var pa = o.a.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var pb = (o.b || []).map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || 'Grafik') + '"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563eb" stop-opacity=".28"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs>';
    for (var k = 0; k <= 4; k++) { var v = max * k / 4; s += '<line class="gridl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ax" x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : Math.round(v)) + '</text>'; }
    s += '<path d="' + pa + ' L' + x(n - 1) + ' ' + (T + ih) + ' L' + x(0) + ' ' + (T + ih) + 'Z" fill="url(#ga)"/>';
    if (pb) s += '<path d="' + pb + '" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<path d="' + pa + '" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>';
    o.labels.forEach(function (lb, i) {
      var cw = iw / Math.max(n - 1, 1), tip = '<b>' + esc(lb) + '</b><br><span style=color:#2563eb>●</span> ' + esc(o.nameA) + ': <b>' + o.a[i] + '</b>' + (o.b ? '<br><span style=color:#f59e0b>●</span> ' + esc(o.nameB) + ': <b>' + o.b[i] + '</b>' : '');
      s += '<text class="ax" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(lb) + '</text><g class="col"><rect class="hit" x="' + (x(i) - cw / 2) + '" y="' + T + '" width="' + cw + '" height="' + ih + '" data-tip="' + esc(tip) + '"/><line class="gl" x1="' + x(i) + '" x2="' + x(i) + '" y1="' + T + '" y2="' + (T + ih) + '" stroke="#2563eb" stroke-dasharray="3 3"/><circle class="dt" cx="' + x(i) + '" cy="' + y(o.a[i]) + '" r="4.5" fill="#2563eb" stroke="#fff" stroke-width="2"/>' + (o.b ? '<circle class="dt" cx="' + x(i) + '" cy="' + y(o.b[i]) + '" r="4.5" fill="#f59e0b" stroke="#fff" stroke-width="2"/>' : '') + '</g>';
    });
    return '<div class="chart">' + s + '</svg></div>';
  }
  function barChart(o) {
    var W = 420, H = 250, n = o.items.length, gap = 14, bw = (W - gap * (n + 1)) / n, base = H - 28, top = 14, ih = base - top;
    var sel = o.sel == null ? n - 1 : o.sel, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || 'Grafik batang') + '">';
    o.items.forEach(function (it, i) {
      var bx = gap + i * (bw + gap), hh = Math.max(3, ih * it.pct / 100), full = ih;
      s += '<g class="bcol' + (i === sel ? ' sel' : '') + '"><rect class="hit" x="' + (bx - 6) + '" y="0" width="' + (bw + 12) + '" height="' + H + '" data-tip="' + esc(it.tip) + '"/><rect x="' + bx + '" y="' + top + '" width="' + bw + '" height="' + full + '" rx="10" fill="url(#hatch)"/><rect class="bf" x="' + bx + '" y="' + (base - hh) + '" width="' + bw + '" height="' + hh + '" rx="10"/><text class="ax" x="' + (bx + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle" style="' + (i === sel ? 'fill:#2563eb;font-weight:700' : '') + '">' + esc(it.label) + '</text></g>';
    });
    return '<div class="chart"><style>.bcol .bf{fill:#c9d4ff;transition:fill .12s}.bcol.sel .bf,.bcol:hover .bf{fill:#2563eb}</style>' + s.replace('<svg', '<svg').replace('>', '><defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#eef1ff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#dfe3f3" stroke-width="3"/></pattern></defs>') + '</svg></div>';
  }
  function donut(segs, total, label) {
    var R = 52, C = 2 * Math.PI * R, off = 0, s = '<svg viewBox="0 0 140 140" width="140" height="140"><circle cx="70" cy="70" r="' + R + '" fill="none" stroke="#e8ebfb" stroke-width="14"/>';
    segs.forEach(function (g) { if (!g.v || !total) return; var len = C * g.v / total; s += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + g.c + '" stroke-width="14" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)" stroke-linecap="butt"/>'; off += len; });
    return s + '<text x="70" y="68" text-anchor="middle" style="font-size:24px;font-weight:700;fill:#131b2e">' + total + '</text><text x="70" y="86" text-anchor="middle" class="ax">' + esc(label || 'Total') + '</text></svg>';
  }
  function ring(pct, size, ink) {
    size = size || 110; var R = size / 2 - 9, C = 2 * Math.PI * R, v = C * Math.max(0, Math.min(100, pct)) / 100;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + R + '" fill="none" stroke="#e8ebfb" stroke-width="10"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + R + '" fill="none" stroke="' + (ink || '#2563eb') + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + v + ' ' + C + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" style="font-size:' + size / 4.2 + 'px;font-weight:700;fill:#131b2e">' + Math.round(pct) + '%</text></svg>';
  }

  /* ---------- Tooltip global ---------- */
  var tip = null;
  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest && e.target.closest('[data-tip]'); tip = tip || document.getElementById('tip');
    if (!t) { tip.hidden = true; return; }
    tip.innerHTML = t.getAttribute('data-tip'); tip.hidden = false;
  });
  document.addEventListener('mousemove', function (e) {
    if (!tip || tip.hidden) return;
    var x = e.clientX + 14, y = e.clientY + 14, w = tip.offsetWidth;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });

  /* ---------- Toast, modal, konfirmasi ---------- */
  function toast(msg, type) {
    var box = document.getElementById('toasts'), el = document.createElement('div');
    el.className = 'toast ' + (type || ''); el.innerHTML = ico(type === 'err' ? 'alert' : type === 'ok' ? 'circleCheck' : 'info', 18) + '<div>' + esc(msg) + '</div>';
    box.appendChild(el); setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, type === 'err' ? 6000 : 3200);
  }
  var modalStack = 0;
  function modal(o) {
    var ov = document.getElementById('overlay');
    ov.className = 'on' + (o.drawer ? ' drw' : '');
    ov.innerHTML = '<div class="modal ' + (o.drawer ? 'drawer ' : '') + (o.size || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '"><div class="mh"><h2>' + esc(o.title) + '</h2><button class="iconbtn" data-act="modalX" aria-label="Tutup">' + ico('x') + '</button></div><div class="mb2">' + o.body + '</div>' + (o.foot ? '<div class="mf">' + o.foot + '</div>' : '') + '</div>';
    modalStack++; Ui._onClose = o.onClose || null;
    var f = ov.querySelector('input:not([type=hidden]),select,textarea'); if (f && !o.noFocus) setTimeout(function () { try { f.focus(); } catch (e) { } }, 30);
    return ov;
  }
  function closeModal() {
    var ov = document.getElementById('overlay'); ov.className = ''; ov.innerHTML = '';
    var cb = Ui._onClose; Ui._onClose = null; if (cb) cb();
    if (Ui.flush) Ui.flush();
  }
  function isModalOpen() { return document.getElementById('overlay').classList.contains('on'); }
  function konfirmasi(msg, okLabel, bahaya, judul) {
    return new Promise(function (res) {
      modal({ title: judul || 'Konfirmasi', body: '<p>' + esc(msg) + '</p>', foot: '<button class="btn sec" data-act="modalX">Batal</button><button class="btn ' + (bahaya ? 'red' : '') + '" id="cfm-ok">' + esc(okLabel || 'Ya, lanjutkan') + '</button>', noFocus: true });
      var done = false;
      document.getElementById('cfm-ok').onclick = function () { done = true; closeModal(); res(true); };
      Ui._onClose = function () { if (!done) res(false); };
    });
  }
  /** Tombol sibuk: tampilkan spinner & cegah klik ganda. */
  function sibuk(btn, on, label) {
    if (!btn) return; if (on) { btn._h = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin s"></span> ' + esc(label || 'Menyimpan...'); } else { btn.disabled = false; if (btn._h) btn.innerHTML = btn._h; }
  }

  /* ---------- Berkas & ekspor ---------- */
  function unduhBase64(nama, mime, b64) {
    var bin = atob(b64), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    unduhBlob(nama, new Blob([arr], { type: mime || 'application/octet-stream' }));
  }
  function unduhBlob(nama, blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  function bacaFile(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1] || ''); }; r.onerror = function () { rej(new Error('Gagal membaca file')); }; r.readAsDataURL(file); }); }
  function csvEsc(v) { v = v == null ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCsv(head, rows) { return '\ufeff' + [head].concat(rows).map(function (r) { return r.map(csvEsc).join(','); }).join('\r\n'); }
  /** Parser CSV sederhana (koma/titik koma, kutip ganda). */
  function parseCsv(txt) {
    txt = txt.replace(/^\ufeff/, ''); var first = txt.split(/\r?\n/)[0] || '', sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < txt.length; i++) {
      var c = txt[i];
      if (q) { if (c === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true; else if (c === sep) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some(function (x) { return x.trim(); })) rows.push(row); row = []; }
      else cur += c;
    }
    row.push(cur); if (row.some(function (x) { return x.trim(); })) rows.push(row);
    return rows;
  }
  var xlsxP = null;
  function muatXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return xlsxP || (xlsxP = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = function () { res(window.XLSX); }; s.onerror = function () { xlsxP = null; rej(new Error('xlsx')); }; document.head.appendChild(s); }));
  }
  /** Unduh Excel (.xlsx). Bila pustaka tidak bisa dimuat, otomatis jatuh ke CSV. */
  async function unduhExcel(nama, head, rows) {
    try { var X = await muatXlsx(); var ws = X.utils.aoa_to_sheet([head].concat(rows)), wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Data'); X.writeFile(wb, nama + '.xlsx'); }
    catch (e) { unduhBlob(nama + '.csv', new Blob([toCsv(head, rows)], { type: 'text/csv;charset=utf-8' })); toast('Excel tidak tersedia, file diunduh sebagai CSV.', 'warn'); }
  }
  /** PDF lewat jendela cetak (Simpan sebagai PDF). */
  function cetakPdf(judul, head, rows) {
    var w = window.open('', '_blank'); if (!w) { toast('Izinkan pop-up untuk mencetak PDF.', 'err'); return; }
    var tbl = '<table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(judul) + '</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#131b2e}h1{font-size:18px}p{color:#666;font-size:12px}table{border-collapse:collapse;width:100%;font-size:11px}th{background:#2563eb;color:#fff;text-align:left}th,td{border:1px solid #ccd;padding:5px 7px}tr:nth-child(even) td{background:#f4f6ff}</style></head><body><h1>' + esc(judul) + '</h1><p>Dicetak: ' + esc(Wkt.fmt(Wkt.now())) + '</p>' + tbl + '</body></html>');
    w.document.close(); setTimeout(function () { w.focus(); w.print(); }, 300);
  }

  /* ---------- Paginasi ---------- */
  function pager(total, page, per, act) {
    var pages = Math.max(1, Math.ceil(total / per)); page = Math.min(page, pages);
    var from = total ? (page - 1) * per + 1 : 0, to = Math.min(total, page * per), btns = '', st = Math.max(1, Math.min(page - 2, pages - 4)), en = Math.min(pages, st + 4);
    for (var i = st; i <= en; i++) btns += '<button class="pgb' + (i === page ? ' on' : '') + '" data-act="' + act + '" data-p="' + i + '">' + i + '</button>';
    return '<div class="pager"><span>' + from + '–' + to + ' dari ' + total + '</span><div class="pg"><button class="pgb" data-act="' + act + '" data-p="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>' + ico('chevL', 16) + '</button>' + btns + '<button class="pgb" data-act="' + act + '" data-p="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>' + ico('chevR', 16) + '</button></div></div>';
  }
  function slice(list, page, per) { var pages = Math.max(1, Math.ceil(list.length / per)); page = Math.min(Math.max(1, page), pages); return list.slice((page - 1) * per, page * per); }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 120); }; }

  window.Ui = { esc: esc, Wkt: Wkt, avatar: avatar, badge: badge, progress: progress, empty: empty, skel: skel, opt: opt, ukuran: ukuran, jenisIkon: jenisIkon, ROLE_L: ROLE_L,
    areaChart: areaChart, barChart: barChart, donut: donut, ring: ring, toast: toast, modal: modal, closeModal: closeModal, isModalOpen: isModalOpen, konfirmasi: konfirmasi, sibuk: sibuk,
    unduhBase64: unduhBase64, unduhBlob: unduhBlob, bacaFile: bacaFile, toCsv: toCsv, parseCsv: parseCsv, unduhExcel: unduhExcel, cetakPdf: cetakPdf, pager: pager, slice: slice, debounce: debounce };
  window.esc = esc; window.Wkt = Wkt;
})();
