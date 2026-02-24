<?php

namespace App\Helpers;

class Response
{
    /**
     * Send success JSON response
     */
    public static function success($data = null, string $message = 'Success', int $code = 200): array
    {
        return [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'code' => $code
        ];
    }

    /**
     * Send error JSON response
     */
    public static function error(string $message = 'Error', $data = null, int $code = 400): array
    {
        return [
            'success' => false,
            'message' => $message,
            'data' => $data,
            'code' => $code
        ];
    }

    /**
     * Send paginated response
     */
    public static function paginated(array $items, int $page, int $perPage, int $total): array
    {
        return [
            'success' => true,
            'data' => $items,
            'pagination' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $total,
                'pages' => ceil($total / $perPage)
            ]
        ];
    }
}
