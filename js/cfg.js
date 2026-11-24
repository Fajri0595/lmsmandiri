/** cfg.js — Nilai bawaan aplikasi digabung dengan config.js. Umumnya tidak perlu diubah. */
(function () {
  var DEFAULT = {
    API_URL: '',
    NAMA_APP: 'LMS UMUM',
    TZ_OFFSET_JAM: 7,   // WIB = 7, WITA = 8, WIT = 9
    POLL_DETIK: 45      // cek perubahan data di latar belakang
  };
  window.CFG = Object.assign(DEFAULT, window.LMS_CONFIG || {});
})();
