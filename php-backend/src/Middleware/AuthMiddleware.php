<?php

namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class AuthMiddleware implements MiddlewareInterface
{
    private array $publicRoutes = [
        'POST:/api/auth/login',
        'POST:/api/auth/register',
        'GET:/api/health'
    ];

    public function process(Request $request, RequestHandler $handler): Response
    {
        $method = $request->getMethod();
        $path = $request->getUri()->getPath();
        $route = "$method:$path";

        // Check if route is public
        foreach ($this->publicRoutes as $publicRoute) {
            if (str_starts_with($route, $publicRoute)) {
                return $handler->handle($request);
            }
        }

        // Get authorization header
        $authHeader = $request->getHeaderLine('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->respondWithError('Missing or invalid authorization header', 401);
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
            $request = $request->withAttribute('user', $decoded);
        } catch (\Exception $e) {
            return $this->respondWithError('Invalid token: ' . $e->getMessage(), 401);
        }

        return $handler->handle($request);
    }

    private function respondWithError(string $message, int $code): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode(['success' => false, 'message' => $message, 'code' => $code]));
        return $response->withStatus($code)->withHeader('Content-Type', 'application/json');
    }
}
