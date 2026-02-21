# Examo - Online Exam Platform: AI Coding Agent Guidelines

## Architecture Overview

**Examo** is a React + TypeScript exam management platform with dual-role support (teachers/students), AI-powered question generation, and optional Supabase integration.

### Key Components

- **App.tsx**: Central state hub managing user authentication, exam lifecycle, and navigation across views
- **types.ts**: Defines core domain models: `User`, `Exam`, `Question`, `ExamResult`
- **lib/supabase.ts**: Fallback-first pattern—uses real Supabase if configured, otherwise falls back to mock data
- **components/**: Modular UI components (ExamRunner, AIGenerator, ExamEditor, QuestionBank, StudentManager)
- **services/aiService.ts**: Gemini API integration for question generation (lazy-loaded to avoid side effects)

### Data Flow

1. **Authentication**: Mock users (MOCK_TEACHER, MOCK_STUDENT) or Supabase query on `users` table
2. **Exams**: Created via ExamEditor, generated via AIGenerator (Gemini), or loaded from mock MOCK_EXAMS
3. **Exam Session**: ExamRunner manages timer, tab-blur tracking (with violation limits), autosave, and answer logging
4. **Results**: Submitted to `exam_results` table or stored locally; calculated with point breakdowns
5. **Gradebook**: Aggregates student results by exam; teachers view via TEACHER_GRADES view

## Critical Developer Workflows

### Run Locally
```bash
npm install
npm run dev        # Starts Vite on http://localhost:3000
npm run build      # Production build
npm run lint       # TypeScript check (no emit)
```

### Environment Variables
- **Gemini API**: `GEMINI_API_KEY` (or `API_KEY` in vite.config.ts define block)
- **Supabase**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (also checks NEXT_PUBLIC_* variants)
- Missing vars? App gracefully falls back to mocks with console warnings

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Icons**: lucide-react
- **AI**: Google Gemini (`@google/genai`, model: `gemini-3-pro-preview`)
- **DB**: Supabase (optional; uses mocks if unconfigured)
- **Export**: jsPDF + jspdf-autotable for gradebook reports
- **Spreadsheet**: xlsx for bulk data import/export

## Project-Specific Patterns & Conventions

### 1. Question Types & Scoring
Five question types with distinct properties:
- **MCQ**: 4 options, `correctAnswerIndex` (0-3), auto-scored
- **True/False**: boolean `trueFalseAnswer`, auto-scored
- **Short Answer**: `shortAnswer` text key; case-insensitive matching
- **Essay**: `essayAnswer` (rubric points or expected content); manual/AI review recommended
- **Multiple Select**: `correctAnswerIndices` (array), auto-scored

Points are per-question; no curves applied.

### 2. Exam Lifecycle & States
- **Draft**: Created but unpublished; teachers can edit questions
- **Published**: Students can start; teachers can view results
- **In Progress**: Exam session active; autosave every change; violates on 3 tab-blur events
- **Completed**: Submitted; results calculated and immutable

### 3. ExamRunner Tab-Blur Detection
`ExamRunner` tracks focus events; warnings after 1st violation, submission block after 3rd. Purpose: prevent cheating via alt-tab. Pattern:
```tsx
const handleBlur = () => {
  const newCount = violationCount + 1;
  setViolationCount(newCount);
  setLogs(prev => [...prev, { event: 'tab_blur', timestamp: ... }]);
  if (newCount >= MAX_VIOLATIONS) { /* force submit */ }
};
```

### 4. Fallback-First Supabase Pattern
Check `isSupabaseConfigured` (boolean) before calling supabase:
```tsx
if (isSupabaseConfigured && supabase) {
  // Real database call
} else {
  // Use MOCK_EXAMS, MOCK_STUDENT, etc.
}
```
Enables local development without credentials.

### 5. Lazy AI Client Initialization
`aiService.ts` initializes Gemini client only on first generation call to avoid fetch-polyfill issues. Uses dynamic import:
```tsx
const { GoogleGenAI, Type } = await import("@google/genai");
```

### 6. Vite Build Polyfill Setup
`vite.config.ts` aliases `node-fetch`, `cross-fetch`, etc., to custom `lib/fetch-polyfill.ts` (handles browser fetch in SSR context). Also bakes env vars into `process.env.*` for robustness.

### 7. Exam Question Randomization
`ExamRunner` shuffles questions if `exam.randomizeQuestions` is true. Stored in state; reused across sessions via `existingProgress`.

### 8. Autosave & Logging
Every answer change triggers `onAutosave()` callback with current `answers` and `logs` array. Logs track: `start`, `tab_blur`, `tab_focus`, `autosave`, `submit` events with timestamps.

### 9. Student Manager & Bulk Import
`StudentManager` supports CSV/XLSX upload. Parses rows and adds new users to `users` table or updates existing. Requires: `email`, `name`, optional `nis`, `grade`, `school`.

## Key Files & When to Edit

| File | Purpose | When to Edit |
|------|---------|--------------|
| [types.ts](types.ts) | Domain models | Add question types, user fields, or exam properties |
| [App.tsx](App.tsx#L200) | State management, views, auth | Main business logic; route view changes here |
| [services/aiService.ts](services/aiService.ts) | Gemini integration | Change prompt, model, or question validation |
| [components/ExamRunner.tsx](components/ExamRunner.tsx) | Exam UI & interaction | Timer, navigation, answer input, submit flow |
| [lib/supabase.ts](lib/supabase.ts) | DB config & mocks | Update mock data or change fallback logic |
| [vite.config.ts](vite.config.ts) | Build & env setup | Adjust ports, add aliases, or polyfills |

## Indonesian Localization Notes

- UI text is **Indonesian** (id-ID) throughout
- Dates formatted with `toLocaleDateString('id-ID', ...)`
- Mock data uses Indonesian school/person names and subjects (Matematika, Aljabar, Kalkulus)
- API prompts to Gemini are in Indonesian; responses expected in Indonesian

## Cross-Component Communication

- **Parent → Child**: Props (exam, onStart, onFinish callbacks)
- **App.tsx State Updates**: Direct `useState` setter calls (no Redux/Context)
- **Persistent Data**: Supabase tables or localStorage (via autosave callbacks)
- **Modal Navigation**: View state in `App.tsx` (e.g., setView('EXAM_SESSION'))

## Common Gotchas

1. **Missing API Keys**: App silently falls back to mocks; check console for warnings
2. **Exam Duration**: In minutes (`durationMinutes * 60` → seconds for timer)
3. **Score Calculation**: Sum of question points earned, not percentage
4. **Tab Violations**: Only tracked during exam session, resets on restart
5. **Question Types**: Ensure correct optional fields per type (e.g., `trueFalseAnswer` for T/F, not MCQ)
