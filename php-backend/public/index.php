<?php

require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Slim\Routing\RouteCollectorProxy;
use App\Middleware\CorsMiddleware;
use App\Middleware\AuthMiddleware;
use App\Controllers\AuthController;
use App\Controllers\ExamController;
use App\Controllers\QuestionController;
use App\Controllers\ResultController;
use App\Controllers\StudentController;
use App\Controllers\MaterialController;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Create app
$app = AppFactory::create();

// Add middleware
$app->add(new CorsMiddleware());

// Add routes group with auth middleware - must come BEFORE static routes
$app->group('/api', function (RouteCollectorProxy $group) {
    // Auth routes (public)
    $group->post('/auth/login', [AuthController::class, 'login']);
    $group->post('/auth/register', [AuthController::class, 'register']);
    $group->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'ok']));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // Protected routes
    $group->get('/auth/me', [AuthController::class, 'getCurrentUser']);

    // Exam routes
    $group->get('/exams', [ExamController::class, 'getTeacherExams']);
    $group->post('/exams', [ExamController::class, 'createExam']);
    $group->patch('/exams/{id}/publish', [ExamController::class, 'publishExam']);
    $group->get('/exams/published', [ExamController::class, 'getPublishedExams']);

    // Question routes
    $group->get('/exams/{id}/questions', [QuestionController::class, 'getQuestions']);
    $group->post('/exams/{id}/questions', [QuestionController::class, 'createQuestion']);

    // Result routes
    $group->post('/exams/{id}/submit', [ResultController::class, 'submitExam']);
    $group->get('/results', [ResultController::class, 'getStudentResults']);

    // Student routes
    $group->get('/students', [StudentController::class, 'getStudents']);
    $group->post('/students', [StudentController::class, 'addStudent']);

    // Material routes
    $group->post('/materials', [MaterialController::class, 'uploadMaterial']);
    $group->get('/materials/{id}', [MaterialController::class, 'downloadMaterial']);
})->add(new AuthMiddleware());

// Root route - serve frontend (after /api to avoid conflicts)
$app->get('/', function ($request, $response) {
    $filePath = __DIR__ . '/index.html';
    if (file_exists($filePath)) {
        $response->getBody()->write(file_get_contents($filePath));
        return $response->withHeader('Content-Type', 'text/html');
    }
    $response->getBody()->write(json_encode(['message' => 'Welcome to EXAMO API', 'version' => '1.0']));
    return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
});

// Run app
$app->run();
