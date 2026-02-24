<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ResultController
{
    public function submitExam(Request $request, Response $response, array $args): Response
    {
        // TODO: Implement submit exam result
        return $response->withStatus(501);
    }

    public function getStudentResults(Request $request, Response $response): Response
    {
        // TODO: Implement get student results
        return $response->withStatus(501);
    }
}
