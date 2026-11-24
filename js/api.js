/** api.js — Klien REST ke Google Apps Script. Satu pintu: semua panggilan lewat Api.call().
 *  - POST text/plain (tanpa preflight CORS), token sesi di body (bukan di URL).
 *  - Bacaan identik yang sedang berjalan digabung (dedupe) dan di-retry sekali; tulisan TIDAK di-retry (cegah ganda). */
(function () {
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var Api = {
    token: null,
    onAuth: null,
    _in: {},
    ok: function () { return typeof CFG.API_URL === 'string' && /^https?:\/\//.test(CFG.API_URL); },
    warm: function (scope) { if (!this.ok()) return; try { fetch(CFG.API_URL + '?w=' + (scope || 'app'), { mode: 'no-cors' }); } catch (e) { } },
    call: function (action, data, o) {
      o = o || {};
      var self = this, key = o.write ? null : action + JSON.stringify(data || {});
      if (key && self._in[key]) return self._in[key];
      var p = self._do(action, data, o);
      if (key) { self._in[key] = p; p.then(function () { delete self._in[key]; }, function () { delete self._in[key]; }); }
      return p;
    },
    _do: async function (action, data, o) {
      if (!this.ok()) return { success: false, message: 'URL API belum diatur. Isi API_URL di js/config.js.', offline: true };
      var body = JSON.stringify({ action: action, data: data || {}, token: this.token });
      var tries = o.write ? 1 : 2;
      for (var i = 0; i < tries; i++) {
        var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, o.timeout || 45000);
        try {
          var res = await fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, signal: ctl.signal });
          clearTimeout(t);
          var j = await res.json();
          if (j && j.code === 'AUTH' && this.onAuth) this.onAuth(j.message);
          return j;
        } catch (e) { clearTimeout(t); if (i + 1 < tries) await sleep(700); }
      }
      return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', offline: true };
    }
  };
  window.Api = Api;
})();
