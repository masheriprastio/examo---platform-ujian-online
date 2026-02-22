# AI Generator Dynamic Import Fix - Verification Guide

## Issue Summary
**Problem**: "Failed to fetch dynamically imported module" error when accessing AI Generator on Vercel production, specifically when attempting to upload documents and generate questions.

**Root Cause**: Dynamic import of `@google/genai` module failing during Vercel build/runtime due to:
- Chunk splitting issues causing loader failures
- Missing error handling for import failures
- Environment variable mismatch between local (API_KEY) and Vercel setup

**Commit**: `ba886d9` - "Fix: Improve AI module loading on Vercel..."

---

## Changes Applied

### 1. **vite.config.ts** - Build Optimization
```typescript
// Added to build configuration
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'google-genai': ['@google/genai']  // Forces separate chunk bundling
      }
    }
  }
}
```
**Impact**: Forces `@google/genai` into dedicated `google-genai-[hash].js` chunk (~274 KB), preventing chunk loader failures.

### 2. **services/aiService.ts** - Error Handling & Env Vars
```typescript
// Before
const apiKey = process.env.API_KEY;
const { GoogleGenAI, Type } = await import("@google/genai");

// After
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
try {
  const { GoogleGenAI, Type } = await import("@google/genai");
  // ... initialization
} catch (error) {
  console.error("Failed to import @google/genai:", error);
  throw new Error("Gagal memuat library AI. Silakan refresh halaman dan coba lagi.");
}
```
**Impact**: 
- Fallback API key support (GEMINI_API_KEY) for flexibility
- Graceful error handling with user-friendly error message
- Better console logging for debugging

---

## Verification Steps

### Phase 1: Local Testing (Before Production)
1. **Verify build succeeds locally**:
   ```bash
   npm run build
   ```
   ✓ Expected: Build completes, `google-genai-[hash].js` appears in dist/assets/

2. **Check bundle size**:
   ```bash
   ls -lh dist/assets/ | grep google-genai
   ```
   ✓ Expected: google-genai chunk ~270-280 KB gzipped

3. **Verify dev server runs**:
   ```bash
   npm run dev
   ```
   ✓ Expected: Server starts without errors on http://localhost:3000 or 3001

### Phase 2: Vercel Deployment Check
1. **Monitor Vercel rebuild**: 
   - Visit: https://vercel.com/masheriprastio/examo---platform-ujian-online/deployments
   - Wait for status: "Ready" (green checkmark)
   - Check build logs for errors (no "chunk load failed" messages)

2. **Verify environment variables on Vercel**:
   - Project Settings → Environment Variables
   - Confirm **GEMINI_API_KEY** (or **API_KEY**) is set
   - If changed, trigger rebuild

### Phase 3: Production Testing
1. **Access AI Generator**:
   - URL: https://examo-platform-ujian-online.vercel.app
   - Login as teacher (MOCK_TEACHER / password: demo123)
   - Navigate to: Exam Management → Create Exam → AI Generator tab

2. **Test document upload**:
   - Click "Upload Document" button
   - Select a PDF or text file
   - Verify no console errors (F12 → Console tab)
   - Expected: File loads, preview appears

3. **Test question generation**:
   - Enter number of questions (e.g., 5)
   - Click "Generate with AI" button
   - Monitor Network tab (F12 → Network):
     - Should see successful fetch to Gemini API
     - **google-genai-[hash].js** chunk should load (~274 KB)
     - No "Failed to fetch" errors
   - Expected: Questions generate within 10-20 seconds

4. **Verify error handling**:
   - If generation fails, error message should be: "Gagal memuat library AI. Silakan refresh halaman dan coba lagi."
   - Check browser console for detailed error info

### Phase 4: Full Exam Flow
1. **Create exam with AI-generated questions**:
   - Generate questions via AI Generator
   - Review and edit if needed
   - Save exam

2. **Test as student**:
   - Logout (or new incognito window)
   - Login as MOCK_STUDENT / demo123
   - Start exam
   - Verify questions display correctly
   - Submit and check results

---

## Rollback Plan (If Issues Persist)

If Vercel deployment still fails, try these additional steps:

### Option A: Clear Vercel Cache
1. Vercel Dashboard → Settings → Git
2. Click "Clear Build Cache"
3. Trigger new deployment (push empty commit)

### Option B: Increase Build Timeout
Vercel settings may timeout if build takes >15min. Usually not issue, but verify:
1. vercel.json: Set `builds` timeout if exists
2. Or contact Vercel support

### Option C: Manual Chunk Configuration
If manualChunks not working, try alternative in vite.config.ts:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes('node_modules/@google')) {
          return 'google-genai';
        }
      }
    },
    chunkSizeWarningLimit: 600  // Suppress warnings
  }
}
```

### Option D: Environment Variable Verification
Ensure Vercel has correct env vars:
```bash
# In Vercel dashboard, verify:
GEMINI_API_KEY=sk-... (or similar)
VITE_GEMINI_API_KEY=sk-... (if using Vite prefix)
```

---

## Expected Outcomes After Fix

✅ **AI Generator loads successfully on Vercel**
- No "Failed to fetch dynamically imported module" error
- Document upload works
- Question generation completes in 10-20 seconds

✅ **Better error messages**
- If API key missing: "API Key Gemini tidak ditemukan..."
- If import fails: "Gagal memuat library AI. Silakan refresh halaman dan coba lagi."
- Console logs show exact error details for debugging

✅ **Build optimization**
- google-genai chunk created separately (~274 KB)
- Chunk loads independently without blocking other assets
- No chunk loader failures on production

---

## Troubleshooting

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Still getting "Failed to fetch" | Check Vercel build logs for chunk errors | Try Clear Build Cache (Option A) |
| "API Key not found" error | GEMINI_API_KEY not set in Vercel | Add env var in Vercel Settings |
| AI Generator button does nothing | Import error silently failing | Check F12 Console for detailed error |
| Question generation timeout | Large document or slow Gemini response | Increase Gemini timeout in aiService.ts |
| Build takes too long | Vercel resources limited | Split app further with dynamic imports |

---

## Monitoring Post-Fix

After deployment, monitor:
1. **Vercel Logs**: Check for runtime errors related to google-genai import
2. **Sentry/Error tracking**: If configured, watch for new patterns
3. **User feedback**: Confirm AI Generator works for teachers
4. **Performance**: Monitor chunk load time (should be <2 seconds)

---

## Summary

These fixes address the dynamic import error by:
1. **Explicit chunk splitting** - Forces google-genai into separate bundle
2. **Graceful error handling** - Try-catch prevents unhandled promise rejections
3. **Environment flexibility** - Supports multiple API key env var names
4. **Better debugging** - Clear error messages and console logs

The error should now be **resolved on Vercel**. If issues persist after deployment, use troubleshooting steps above.
