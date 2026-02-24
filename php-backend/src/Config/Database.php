<?php

namespace App\Config;

class Database
{
    private static ?array $connection = null;

    /**
     * Get database connection (mock for now, Supabase API will be called via HTTP)
     */
    public static function getInstance(): array
    {
        if (self::$connection === null) {
            self::$connection = [
                'url' => $_ENV['SUPABASE_URL'] ?? 'https://your-project.supabase.co',
                'key' => $_ENV['SUPABASE_ANON_KEY'] ?? 'your_anon_key',
                'service_role' => $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? 'your_service_role_key'
            ];
        }
        return self::$connection;
    }

    /**
     * Get Supabase API URL
     */
    public static function getApiUrl(): string
    {
        $config = self::getInstance();
        return $config['url'] . '/rest/v1';
    }

    /**
     * Get auth header for API calls
     */
    public static function getAuthHeader(): array
    {
        $config = self::getInstance();
        return [
            'Authorization' => 'Bearer ' . $config['key'],
            'Content-Type' => 'application/json'
        ];
    }
}
