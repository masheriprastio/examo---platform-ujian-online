<?php

namespace App\Services;

use App\Config\Database;
use App\Helpers\UUID;

class ExamService
{
    /**
     * Mock exams database - replace with Supabase later
     */
    private static array $exams = [
        [
            'id' => 'exam-001',
            'title' => 'Ujian Matematika Semester 1',
            'description' => 'Ujian formatif untuk mengukur pemahaman konsep dasar',
            'duration_minutes' => 90,
            'status' => 'published',
            'randomize_questions' => false,
            'created_by' => 'teacher-001',
            'created_at' => '2026-02-24T10:00:00Z'
        ]
    ];

    /**
     * Get all exams for a teacher
     */
    public function getExamsByTeacher(string $teacherId, int $page = 1, int $perPage = 10): array
    {
        try {
            $filtered = array_filter(self::$exams, fn($e) => $e['created_by'] === $teacherId);
            $total = count($filtered);
            $from = ($page - 1) * $perPage;
            $items = array_slice($filtered, $from, $perPage);

            return [
                'success' => true,
                'data' => array_values($items),
                'pagination' => [
                    'page' => $page,
                    'perPage' => $perPage,
                    'total' => $total,
                    'pages' => ceil($total / $perPage)
                ]
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'code' => 500];
        }
    }

    /**
     * Create new exam
     */
    public function createExam(array $data): array
    {
        try {
            $examId = UUID::v4();

            $newExam = [
                'id' => $examId,
                'title' => $data['title'] ?? 'Untitled Exam',
                'description' => $data['description'] ?? null,
                'duration_minutes' => $data['duration_minutes'] ?? 60,
                'status' => 'draft',
                'randomize_questions' => $data['randomize_questions'] ?? false,
                'created_by' => $data['created_by'],
                'created_at' => date('c')
            ];

            self::$exams[] = $newExam;

            return [
                'success' => true,
                'message' => 'Exam created successfully',
                'data' => ['id' => $examId, 'exam' => $newExam]
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'code' => 500];
        }
    }

    /**
     * Publish exam (make available to students)
     */
    public function publishExam(string $examId, string $teacherId): array
    {
        try {
            foreach (self::$exams as &$exam) {
                if ($exam['id'] === $examId && $exam['created_by'] === $teacherId) {
                    $exam['status'] = 'published';
                    return ['success' => true, 'message' => 'Exam published successfully'];
                }
            }

            return ['success' => false, 'message' => 'Exam not found or unauthorized', 'code' => 404];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'code' => 500];
        }
    }

    /**
     * Get published exams for students
     */
    public function getPublishedExams(): array
    {
        try {
            $filtered = array_filter(self::$exams, fn($e) => $e['status'] === 'published');
            return [
                'success' => true,
                'data' => array_values($filtered)
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'code' => 500];
        }
    }
}
