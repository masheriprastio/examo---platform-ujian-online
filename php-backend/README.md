# 📖 README - Referensi API & Dokumentasi

## Daftar Isi
1. [API Endpoints](#api-endpoints)
2. [Authentication](#authentication)
3. [Data Models](#data-models)
4. [Troubleshooting](#troubleshooting)

---

## API Endpoints

### Authentication (Public)

#### POST /api/auth/login
Login dengan email dan password.

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@examo.test",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "uuid",
      "email": "teacher@examo.test",
      "name": "Teacher Name",
      "role": "guru"
    }
  }
}
```

#### POST /api/auth/register
Register user baru.

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@examo.test",
    "name": "New User",
    "password": "password123",
    "role": "siswa"
  }'
```

#### GET /api/auth/me
Get current user info (requires auth).

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Exam Endpoints

#### GET /api/exams
Get semua exam milik teacher.

```bash
curl -X GET http://localhost:8000/api/exams \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### POST /api/exams
Create exam baru.

```bash
curl -X POST http://localhost:8000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Ujian Matematika",
    "description": "Ujian semester 1",
    "duration_minutes": 90,
    "randomize_questions": true
  }'
```

#### PATCH /api/exams/{id}/publish
Publish exam (make visible to students).

```bash
curl -X PATCH http://localhost:8000/api/exams/exam-uuid/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### GET /api/exams/published
Get semua published exam (untuk students).

```bash
curl -X GET http://localhost:8000/api/exams/published
```

---

## Authentication

### JWT Token
Token digenerate saat login, expire dalam 24 jam.

**Header format:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Public Routes
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/health`

### Protected Routes
Semua route lain memerlukan valid JWT token di header `Authorization`.

---

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "user@examo.test",
  "name": "User Name",
  "password_hash": "bcrypt_hash",
  "role": "guru|siswa",
  "grade": "10",
  "school": "School Name",
  "nis": "123456",
  "created_at": "2026-02-24T10:00:00Z"
}
```

### Exam
```json
{
  "id": "uuid",
  "title": "Exam Title",
  "description": "Exam description",
  "duration_minutes": 90,
  "status": "draft|published",
  "randomize_questions": true,
  "created_by": "teacher-uuid",
  "created_at": "2026-02-24T10:00:00Z"
}
```

### Question
```json
{
  "id": "uuid",
  "exam_id": "exam-uuid",
  "type": "mcq|true_false|short_answer|essay|multiple_select",
  "question_text": "Question text...",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correct_answer_index": 0,
  "points": 10,
  "created_at": "2026-02-24T10:00:00Z"
}
```

---

## Troubleshooting

### Error: "Missing or invalid authorization header"
**Solusi:** Pastikan Anda mengirim token di header Authorization.

```bash
# ❌ Salah
curl http://localhost:8000/api/exams

# ✅ Benar
curl http://localhost:8000/api/exams \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Error: "Invalid token"
**Solusi:** Token sudah expired atau tidak valid. Login kembali.

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@examo.test", "password": "password123"}'
```

### Error: "Cannot connect to database"
**Solusi:** 
1. Cek Supabase URL dan key di `.env`
2. Cek koneksi internet
3. Cek status Supabase project

### Error: "Class not found"
**Solusi:**
```bash
composer install
```

---

## Development Tips

1. **Use Postman**: Download [Postman](https://www.postman.com/) untuk test API
2. **Check Logs**: Browser console dan PHP error log helpful untuk debug
3. **Database GUI**: Gunakan Supabase dashboard untuk view/edit data langsung
4. **Test First**: Test API sebelum implement frontend

---

**Status**: ✅ Production Ready  
**Last Updated**: February 24, 2026
