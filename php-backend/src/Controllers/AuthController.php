<?php

namespace App\Controllers;

use App\Services\AuthService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AuthController
{
    private $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    public function login(Request $request, Response $response): Response
    {
        try {
            $data = json_decode($request->getBody(), true);
            $result = $this->authService->login($data['email'], $data['password']);

            $response->getBody()->write(json_encode($result));
            return $response->withStatus($result['success'] ? 200 : 401)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function register(Request $request, Response $response): Response
    {
        try {
            $data = json_decode($request->getBody(), true);
            $result = $this->authService->register($data['email'], $data['name'], $data['password']);

            $response->getBody()->write(json_encode($result));
            return $response->withStatus($result['success'] ? 201 : 400)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getCurrentUser(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $result = $this->authService->getCurrentUser($user->id);

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }
}
