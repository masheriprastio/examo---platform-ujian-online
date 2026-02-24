<?php

namespace App\Services;

use App\Config\Database;
use App\Helpers\UUID;

class AuthService
{
    /**
     * Mock user database - replace with Supabase calls later
     */
    private static array $users = [
        [
            'id' => 'teacher-001',
            'email' => 'teacher@examo.test',
            'name' => 'Guru Matematika',
            'password_hash' => '$2y$10$Fh7xLV.c/3LdJxqUq3KOiuUIqLxUvE1EIZkbOuWIk/gyR60bPnGV2', // password123
            'role' => 'guru'
        ],
        [
            'id' => 'student-001',
            'email' => 'student@examo.test',
            'name' => 'Siswa Test',
            'password_hash' => '$2y$10$Fh7xLV.c/3LdJxqUq3KOiuUIqLxUvE1EIZkbOuWIk/gyR60bPnGV2', // password123
            'role' => 'siswa'
        ]
    ];

    /**
     * Login user and return JWT token
     */
    public function login(string $email, string $password): array
    {
        try {
            // Find user
            $user = null;
            foreach (self::$users as $u) {
                if ($u['email'] === $email) {
                    $user = $u;
                    break;
                }
            }

            if (!$user || !password_verify($password, $user['password_hash'])) {
                return ['success' => false, 'message' => 'Invalid credentials', 'code' => 401];
            }

            // Generate JWT token manually (without firebase/php-jwt library)
            $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
            $payload = json_encode([
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'iat' => time(),
                'exp' => time() + (int)($_ENV['JWT_EXPIRATION'] ?? 86400)
            ]);

            $token = $this->encodeJWT($header, $payload, $_ENV['JWT_SECRET'] ?? 'your_super_secret_jwt_key');

            return [
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'role' => $user['role']
                    ]
                ]
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'code' => 500];
        }
    }

    /**
     * Register new user
     */
    public function register(string $email, string $name, string $password, string $role = 'siswa'): array
    {
        try {
            // Check if email exists
            foreach (self::$users as $u) {
                if ($u['email'] === $email) {
                    return ['success' => false, 'message' => 'Email already exists', 'code' => 409];
                }
            }

            $userId = UUID::v4();
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);

            $newUser = [
                'id' => $userId,
                'email' => $email,
                'name' => $name,
                'password_hash' => $passwordHash,
                'role' => $role
            ];

            self::$users[] = $newUser;

            return [
                'success' => true,
                'message' => 'Registration successful',
                'data' => ['id' => $userId]
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'code' => 500];
        }
    }

    /**
     * Get current user by ID
     */
    public function getCurrentUser(string $userId): array
    {
        try {
            foreach (self::$users as $u) {
                if ($u['id'] === $userId) {
                    return [
                        'success' => true,
                        'data' => [
                            'id' => $u['id'],
                            'email' => $u['email'],
                            'name' => $u['name'],
                            'role' => $u['role']
                        ]
                    ];
                }
            }

            return ['success' => false, 'message' => 'User not found', 'code' => 404];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'code' => 500];
        }
    }

    /**
     * Encode JWT token manually
     */
    private function encodeJWT(string $header, string $payload, string $secret): string
    {
        $headerEncoded = $this->base64UrlEncode($header);
        $payloadEncoded = $this->base64UrlEncode($payload);
        $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true);
        $signatureEncoded = $this->base64UrlEncode($signature);

        return "$headerEncoded.$payloadEncoded.$signatureEncoded";
    }

    /**
     * Base64 URL encode
     */
    private function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
}
