# Instruksi: Salin full HTTP response (Chrome / Firefox)

## Chrome (DevTools)
1. Buka halaman login, tekan F12 untuk DevTools.
2. Pilih tab "Network".
3. Lakukan login (submit). Di daftar Network, temukan request login (biasanya POST ke /auth atau /api/login).
4. Klik request tersebut → tab "Headers" untuk lihat status code.
5. Pilih tab "Response" → copy seluruh isi JSON (CTRL/Cmd+A lalu CTRL/Cmd+C).
6. Jika ingin juga header & status: kanan pada request → "Copy" → "Copy response" atau "Copy as cURL" untuk debugging lengkap.

## Firefox
1. Buka halaman login, tekan F12 → tab "Network".
2. Lakukan login, pilih request login di daftar.
3. Tab "Response" → copy seluruh body JSON.
4. Untuk headers/status: tab "Headers" atau "Copy" → "Copy as cURL".

## Alternatif: curl (terminal)
1. Jalankan curl dengan URL dan payload yang sama:
   curl -i -X POST 'https://your.host/login' -H "Content-Type: application/json" -d '{"email":"...","password":"..."}'
2. Salin output (status line + headers + body).

## Apa yang perlu Anda kirim ke saya
- Status code (mis. 401 / 200)
- Body response lengkap (JSON)
- Jika ada, cURL output atau full response headers

Jangan sertakan password asli — cukup tunjukkan response body JSON dan status code.