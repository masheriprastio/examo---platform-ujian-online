<?php
/**
 * Ini adalah contoh endpoint API PHP Microservice.
 * File ini nantinya diunggah ke server PHP Anda (cPanel/VPS), BUKAN di Vercel.
 */

// 1. Izinkan akses dari domain Vercel Anda (CORS)
header("Access-Control-Allow-Origin: *"); // Ganti * dengan domain Vercel Anda saat produksi untuk keamanan
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Tangani preflight request dari browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Simulasi logika bisnis (Misal: Sinkronisasi data ke Supabase atau tugas berat)
$action = isset($_GET['action']) ? $_GET['action'] : 'status';

if ($action === 'status') {
    // Kembalikan respons JSON ke React
    echo json_encode([
        "status" => "success",
        "message" => "API PHP Microservice berjalan dengan baik!",
        "server_time" => date("Y-m-d H:i:s"),
        "php_version" => phpversion()
    ]);
} elseif ($action === 'sync_jibas') {
    // Logika Sinkronisasi JIBAS akan ditaruh di sini
    echo json_encode([
        "status" => "processing",
        "message" => "Sinkronisasi JIBAS sedang dijalankan di latar belakang..."
    ]);
} else {
    http_response_code(404);
    echo json_encode([
        "status" => "error",
        "message" => "Endpoint tidak ditemukan"
    ]);
}
?>
