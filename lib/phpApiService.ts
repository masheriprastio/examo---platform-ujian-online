/**
 * Service ini bertugas menjembatani aplikasi React (Vercel) dengan API PHP (Server Terpisah).
 */

// Ganti URL ini dengan URL domain tempat Anda meng-hosting file PHP nantinya
// Contoh: https://api.sekolahanda.com
const PHP_API_BASE_URL = 'http://localhost/php-backend';

export interface PhpApiResponse {
    status: 'success' | 'error' | 'processing';
    message: string;
    server_time?: string;
    php_version?: string;
    data?: any;
}

export const PhpApiService = {
    /**
     * Mengecek status server PHP
     */
    async checkStatus(): Promise<PhpApiResponse> {
        try {
            const response = await fetch(`${PHP_API_BASE_URL}/api-status.php?action=status`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Gagal menghubungi API PHP:', error);
            return {
                status: 'error',
                message: 'Gagal menghubungi server PHP. Pastikan URL sudah benar dan server menyala.'
            };
        }
    },

    /**
     * Contoh memanggil fungsi berat (seperti sinkronisasi JIBAS) di PHP
     */
    async triggerJibasSync(): Promise<PhpApiResponse> {
        try {
            // Menggunakan POST jika ada data payload, di sini menggunakan GET sebegai contoh
            const response = await fetch(`${PHP_API_BASE_URL}/api-status.php?action=sync_jibas`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Gagal trigger JIBAS Sync:', error);
            return { status: 'error', message: 'Koneksi ke sistem sinkronisasi terputus.' };
        }
    }
};
