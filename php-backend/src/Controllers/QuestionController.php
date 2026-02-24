<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class QuestionController
{
    public function getQuestions(Request $request, Response $response, array $args): Response
    {
        // TODO: Implement get questions by exam
        return $response->withStatus(501);
    }

    public function createQuestion(Request $request, Response $response, array $args): Response
    {
        // TODO: Implement create question
        return $response->withStatus(501);
    }
}
