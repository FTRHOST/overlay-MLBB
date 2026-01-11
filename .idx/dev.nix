{ pkgs, ... }: {
  # Menentukan saluran nixpkgs yang akan digunakan.
  # Anda dapat memilih saluran stabil terbaru yang tersedia.
  channel = "stable-23.11"; # Atau "stable-24.05" jika sudah tersedia dan diinginkan

  # Paket yang akan diinstal di lingkungan pengembangan.
  # Di sini kita menginstal Node.js yang diperlukan untuk proyek Vite.
  packages = [
    pkgs.nodejs_20 # Menggunakan Node.js versi 20 sebagai contoh
    pkgs.docker-compose
  ];

  # Perintah yang akan dijalankan saat ruang kerja dibuat dan dibuka untuk pertama kalinya.
  # Ini berguna untuk menyiapkan lingkungan, seperti menginstal dependensi npm.
  idx.workspace.onCreate = {
    "npm-install" = "npm install";
  };

  # Perintah yang akan dijalankan setiap kali ruang kerja dibuka.
  # Ini bisa digunakan untuk memulai server pengembangan Vite.
  idx.workspace.onStart = {
    "start-vite-dev-server" = "npm run dev"; # Asumsi Anda memiliki skrip 'dev' di package.json
  };

  # Konfigurasi pratinjau untuk aplikasi web Anda.
  # Ini akan memungkinkan IDX untuk menjalankan dan memuat ulang aplikasi secara otomatis.
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"]; # Perintah untuk memulai server pengembangan Vite
        manager = "web"; # Menentukan bahwa ini adalah pratinjau web
        # cwd = "frontend"; # Opsional: Jika proyek Vite Anda berada di subfolder 'frontend'
      };
    };
  };

  # Variabel lingkungan yang dapat Anda atur jika diperlukan oleh proyek Anda.
  # env = {
  #   VITE_API_URL = "http://localhost:3000/api";
  # };
}
