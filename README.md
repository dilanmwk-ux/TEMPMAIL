# TempMail untuk Vercel

Isi:
- `index.html`: frontend.
- `api/mail.js`: Vercel Function proxy dengan endpoint upstream yang dibatasi.

## Deploy
1. Ekstrak ZIP.
2. Upload isi folder ke repository GitHub baru; `index.html` harus berada di root.
3. Buka https://vercel.com/new lalu import repository.
4. Pilih Framework Preset `Other` bila diminta, tanpa build command.
5. Klik Deploy, lalu tes Generate email dan Cek inbox.

Frontend memanggil `/api/mail` pada domain yang sama, sedangkan function memanggil `temp-mail.app` dari server. Ini menghindari CORS browser untuk request tersebut, tetapi tidak menjamin API upstream menerima request atau tidak memiliki proteksi tambahan. Gunakan layanan sesuai ketentuan penyedia dan jangan gunakan email sementara untuk data sensitif.
