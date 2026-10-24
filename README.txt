NINJA-GLITCH-FINAL
==================
Website mobile-first bertema cyber-futuristic. Statis (HTML5 + CSS3 + Vanilla JS),
tanpa backend, tanpa Node.js, semua path relatif.

ALUR
  index.html (Intro) -> login.html (Login -> Fingerprint -> Ninja Loading) -> dashboard.html

MENJALANKAN
  Jalankan lewat server statis, karena halaman dashboard dimuat dengan fetch():
    - Vercel : deploy folder ini sebagai Static Project (tanpa build command)
    - Lokal  : python -m http.server 8000   lalu buka http://localhost:8000
  (Membuka langsung dengan file:// akan membuat modul dashboard gagal dimuat.)

STRUKTUR
  index.html, login.html, dashboard.html
  style.css, responsive.css
  app.js, animation.js, fingerprint.js, navigation.js, storage.js
  pages/    home, glitch, ninja, tools, lab, rat, history, settings
  assets/   images (webp), icons (svg), effects (particles.js, scanlines.css)

KEAMANAN
  Semua fitur "cyber" adalah SIMULASI VISUAL LOKAL.
  Tidak ada serangan jaringan, malware, RAT sungguhan, pencurian kredensial,
  kontrol perangkat jarak jauh, atau akses ke perangkat/akun lain.
  RAT SIM hanya menampilkan perangkat, koneksi, dan log FIKTIF.
  Login hanya lokal di browser (exact match, case-sensitive; kredensial ada di
  app.js). Ini pintu masuk simulasi, BUKAN keamanan sungguhan: siapa pun bisa
  membaca source code halaman statis.
  Status login disimpan di localStorage (ninjaLoggedIn). Settings > LOGOUT
  mengakhiri sesi; Settings > Reset Local Data menghapus semua data lokal.

DEVELOPER CREDITS
  Tiga kartu terpisah (DEVELOPER / ZAKSS, DAKA, NATHAN) di Dashboard dan Settings.
  Berdampingan di layar lebar, bertumpuk di layar sempit.
