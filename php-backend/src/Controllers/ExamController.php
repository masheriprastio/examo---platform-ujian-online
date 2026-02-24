<?php

namespace App\Controllers;

use App\Services\ExamService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ExamController
{
    private $examService;

    public function __construct()
    {
        $this->examService = new ExamService();
    }

    public function getTeacherExams(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $result = $this->examService->getExamsByTeacher($user->id);

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function createExam(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $data = json_decode($request->getBody(), true);
            $data['created_by'] = $user->id;

            $result = $this->examService->createExam($data);

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function publishExam(Request $request, Response $response, array $args): Response
    {
        try {
            $user = $request->getAttribute('user');
            $examId = $args['id'];

            $result = $this->examService->publishExam($examId, $user->id);

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getPublishedExams(Request $request, Response $response): Response
    {
        try {
            $result = $this->examService->getPublishedExams();

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['success' => false, 'message' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }
}
