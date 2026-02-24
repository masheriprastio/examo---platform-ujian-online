<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class MaterialController
{
    public function uploadMaterial(Request $request, Response $response): Response
    {
        // TODO: Implement material upload
        return $response->withStatus(501);
    }

    public function downloadMaterial(Request $request, Response $response, array $args): Response
    {
        // TODO: Implement material download
        return $response->withStatus(501);
    }
}
