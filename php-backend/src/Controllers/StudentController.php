<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class StudentController
{
    public function getStudents(Request $request, Response $response): Response
    {
        // TODO: Implement get all students
        return $response->withStatus(501);
    }

    public function addStudent(Request $request, Response $response): Response
    {
        // TODO: Implement add student
        return $response->withStatus(501);
    }
}
