# Security Architecture & Implementation Guide

**Last Updated:** 2025-11-08
**Compliance:** Requirement 7.5 - Input Validation and Sanitization

---

## Table of Contents

1. [Overview](#overview)
2. [Security Architecture](#security-architecture)
3. [Input Validation](#input-validation)
4. [Sanitization](#sanitization)
5. [XSS Prevention](#xss-prevention)
6. [SQL Injection Prevention](#sql-injection-prevention)
7. [Content Security Policy (CSP)](#content-security-policy-csp)
8. [API Security](#api-security)
9. [Testing Security Measures](#testing-security-measures)
10. [Developer Guidelines](#developer-guidelines)

---

## Overview

This application implements a **defense-in-depth** security strategy with multiple layers of protection:

1. **Input Validation** - Runtime validation with Zod schemas
2. **Input Sanitization** - Cleaning user input before processing
3. **Framework Auto-Escaping** - Astro and SolidJS escape output by default
4. **Content Security Policy** - Browser-level protection against XSS
5. **Parameterized Queries** - Supabase prevents SQL injection
6. **Rate Limiting** - Protection against brute force attacks
7. **Secure Session Management** - HttpOnly cookies with SameSite

**Key Principle:** Trust no input. Validate everything. Escape all output.

---

## Security Architecture

### Layers of Protection

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: Browser Security (CSP Headers)                    │
│ - Blocks inline scripts and unsafe-eval                     │
│ - Restricts script sources to 'self' only                   │
│ - Prevents plugin loading and frame embedding               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: Framework Auto-Escaping (Astro + SolidJS)         │
│ - All template output is HTML-escaped by default            │
│ - No dangerouslySetInnerHTML usage                          │
│ - Component props are type-checked                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Input Validation (Zod Schemas)                    │
│ - Runtime type validation                                    │
│ - Compile-time type safety                                  │
│ - Enum validation for allowed values                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 4: Input Sanitization (Defense-in-Depth)             │
│ - Remove HTML tags and entities                             │
│ - Strip dangerous characters                                │
│ - Detect malicious patterns                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 5: Database Security (Supabase RLS)                  │
│ - Row Level Security policies                               │
│ - Parameterized queries (automatic)                         │
│ - Type-safe database access                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Input Validation

### Zod Schema Validation

All user input is validated using **Zod** schemas before processing. This provides:

- **Runtime Validation** - Catches invalid data at runtime
- **Type Safety** - TypeScript types automatically inferred
- **Clear Error Messages** - Helpful feedback for debugging
- **Schema Composition** - Reusable validation patterns

**Location:** `src/lib/validation/schemas.ts`

### Validation Schemas

#### UUID Validation

```typescript
import { uuidSchema } from '@/lib/validation'

// Validates format: xxxx-xxxx-xxxx-xxxx
const result = uuidSchema.safeParse(userInput)
if (!result.success) {
  // Handle validation error
  console.error(result.error.message)
  return
}

// Use validated UUID
const uuid = result.data // Guaranteed to be valid format
```

**Security Features:**
- Only allows hex characters and hyphens
- Trims whitespace
- Normalizes to lowercase
- Prevents injection attacks

#### Answer Input Validation

```typescript
import { answerInputSchema } from '@/lib/validation'

const result = answerInputSchema.safeParse(userAnswer)
if (!result.success) {
  return { error: 'Invalid answer format' }
}

const sanitized = result.data
```

**Security Features:**
- Maximum length limit (200 characters) - DoS prevention
- Only allows numbers and math symbols: `0-9.,\-+/%\s()`
- Blocks HTML tags and script content
- Rejects event handlers and protocols
- Prevents code execution attempts

#### Preferences Validation

```typescript
import { preferencesSchema } from '@/lib/validation'

const result = preferencesSchema.safeParse(userPreferences)
if (!result.success) {
  return { error: 'Invalid preferences' }
}

const validated = result.data
```

**Security Features:**
- Enum validation for theme and fontSize
- Boolean type checking (prevents type coercion)
- All fields optional (partial updates safe)
- No arbitrary values allowed

### Using validateInput Helper

```typescript
import { validateInput, uuidSchema } from '@/lib/validation'

const result = validateInput(uuidSchema, userInput)
if (!result.success) {
  return new Response(JSON.stringify({ error: result.error }), {
    status: 400,
  })
}

const uuid = result.data
```

---

## Sanitization

### Defense-in-Depth Approach

While Zod schemas validate structure and types, **sanitization** removes dangerous content from user input. This provides an additional security layer.

**Location:** `src/lib/validation/sanitizer.ts`

### Sanitization Functions

#### Answer Sanitization

```typescript
import { sanitizeAnswer } from '@/lib/validation'

const userInput = '42<script>alert("XSS")</script>'
const sanitized = sanitizeAnswer(userInput)
// Result: '42'
```

**Removes:**
- HTML tags (`<script>`, `<iframe>`, etc.)
- Event handlers (`onclick=`, `onerror=`)
- JavaScript protocols (`javascript:`)
- Data URLs (`data:text/html`)
- Non-math characters

**Preserves:**
- Numbers (`0-9`)
- Math symbols (`., -, +, /, %, ( )`)
- Whitespace (normalized)

#### UUID Sanitization

```typescript
import { sanitizeUUID } from '@/lib/validation'

const userInput = '7B3F-4C2A-8D1E-9F6B<script>'
const sanitized = sanitizeUUID(userInput)
// Result: '7b3f-4c2a-8d1e-9f6b'
```

**Features:**
- Removes non-hex characters
- Normalizes to lowercase
- Trims whitespace
- Preserves hyphen separators

#### Text Sanitization

```typescript
import { sanitizeText } from '@/lib/validation'

const userInput = '<b>Text</b><script>alert("XSS")</script>'
const sanitized = sanitizeText(userInput)
// Result: 'Text' (with HTML entities escaped)
```

### Malicious Pattern Detection

```typescript
import { detectMaliciousInput } from '@/lib/validation'

if (detectMaliciousInput(userInput)) {
  console.warn('Malicious input detected')
  return { error: 'Invalid input' }
}
```

**Detects:**
- Script tags
- Iframe tags
- JavaScript/VBScript protocols
- Event handlers
- `eval()` and `expression()` calls
- ES6 imports
- DOM/window object access
- Object/embed tags
- Data URLs with HTML content

---

## XSS Prevention

### Multi-Layer XSS Protection

**1. Framework Auto-Escaping**

Astro and SolidJS automatically escape all output:

```astro
---
const userInput = '<script>alert("XSS")</script>'
---
<div>{userInput}</div>
<!-- Rendered as: &lt;script&gt;alert("XSS")&lt;/script&gt; -->
```

**NEVER use:**
- `dangerouslySetInnerHTML` in SolidJS
- `set:html` in Astro (unless absolutely necessary with sanitized input)

**2. Input Validation**

```typescript
// API route example
const result = answerInputSchema.safeParse(body.answer)
if (!result.success) {
  return new Response(JSON.stringify({ error: 'Invalid answer' }), {
    status: 400
  })
}
```

**3. Input Sanitization**

```typescript
// Exercise validator example
const sanitized = sanitizeAnswer(userAnswer)
if (detectMaliciousInput(sanitized)) {
  return { correct: false, normalized: '' }
}
```

**4. Content Security Policy**

See [Content Security Policy](#content-security-policy-csp) section below.

### XSS Attack Vectors We Prevent

| Attack Vector | Prevention Method |
|---------------|-------------------|
| `<script>alert("XSS")</script>` | Input sanitization + CSP + framework escaping |
| `<img src=x onerror=alert("XSS")>` | Input sanitization (removes tags and handlers) |
| `javascript:alert("XSS")` | Sanitization (removes protocol) |
| `<iframe src="evil.com">` | Sanitization (removes tags) + CSP (blocks frames) |
| `onclick=alert("XSS")` | Sanitization (removes event handlers) |
| `eval(alert("XSS"))` | Malicious pattern detection + CSP (no unsafe-eval) |
| `${alert("XSS")}` | Framework escaping + validation |

---

## SQL Injection Prevention

### Supabase Parameterized Queries

The Supabase client **automatically** uses parameterized queries, preventing SQL injection:

```typescript
// SAFE: Supabase uses parameterized queries
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('uuid', userInput) // Automatically parameterized

// NEVER construct raw SQL:
// ❌ BAD: Don't do this
const query = `SELECT * FROM users WHERE uuid = '${userInput}'`
```

### Row Level Security (RLS)

Database-level access control ensures users can only access their own data:

```sql
-- Example RLS policy
CREATE POLICY "Users can only see their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);
```

### Type-Safe Database Access

Generated TypeScript types prevent type-related vulnerabilities:

```typescript
import type { Database } from '@/lib/supabase/types'

type User = Database['public']['Tables']['users']['Row']
```

---

## Content Security Policy (CSP)

### CSP Headers

**Location:** `src/lib/security/headers.ts`

**Production CSP:**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

**Key Directives:**

- `script-src 'self'` - Only allow scripts from same origin (no inline scripts)
- `object-src 'none'` - Block Flash, Java, and other plugins
- `frame-ancestors 'none'` - Prevent clickjacking (equivalent to X-Frame-Options: DENY)
- `upgrade-insecure-requests` - Upgrade HTTP to HTTPS automatically

**Development CSP:**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  ...
```

Note: `unsafe-inline` and `unsafe-eval` are allowed in development for HMR (Hot Module Replacement).

### Additional Security Headers

```
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains (production only)
```

---

## API Security

### API Route Security Pattern

**All API routes MUST:**

1. Apply security headers
2. Validate input with Zod
3. Sanitize input (defense-in-depth)
4. Rate limit (where applicable)
5. Return appropriate error codes

**Example:**

```typescript
import type { APIRoute } from 'astro'
import { signInPayloadSchema, sanitizeUUID } from '@/lib/validation'
import { createSecurityHeaders } from '@/lib/security'
import { rateLimiter } from '@/lib/auth/rate-limiter'

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const isDevelopment = import.meta.env.DEV

  try {
    // 1. Rate limiting
    const ip = clientAddress || 'unknown'
    const rateLimit = rateLimiter.check(ip)
    if (!rateLimit.allowed) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
        'Retry-After': rateLimit.retryAfter.toString(),
      })
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers }
      )
    }

    // 2. Parse and validate with Zod
    const body = await request.json()
    const validationResult = signInPayloadSchema.safeParse(body)

    if (!validationResult.success) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })
      const errorMessage = validationResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers }
      )
    }

    // 3. Sanitize (defense-in-depth)
    const { uuid } = validationResult.data
    const sanitized = sanitizeUUID(uuid)

    // 4. Process with sanitized input
    const result = await signInWithUUID(sanitized)

    if (!result.success) {
      rateLimiter.record(ip) // Record failed attempt
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })
      return new Response(
        JSON.stringify(result),
        { status: 404, headers }
      )
    }

    // 5. Return success with security headers
    const headers = createSecurityHeaders(isDevelopment, {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookie,
    })

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('API error:', error)
    const headers = createSecurityHeaders(isDevelopment, {
      'Content-Type': 'application/json',
    })

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers }
    )
  }
}
```

### Rate Limiting

**Location:** `src/lib/auth/rate-limiter.ts`

Protects against brute force attacks:

```typescript
import { rateLimiter } from '@/lib/auth/rate-limiter'

const rateLimit = rateLimiter.check(ipAddress)
if (!rateLimit.allowed) {
  // Return 429 with Retry-After header
}

// On failed authentication:
rateLimiter.record(ipAddress)
```

**Configuration:**
- 5 attempts per 15 minutes per IP (configurable)
- Automatic cleanup of expired entries
- Returns `Retry-After` header

---

## Testing Security Measures

### Security Test Coverage

**Test Files:**
- `src/lib/validation/schemas.test.ts` - Zod schema validation tests
- `src/lib/validation/sanitizer.test.ts` - Sanitization tests
- `src/lib/exercises/validator.test.ts` - Answer validation security tests

### Running Security Tests

```bash
# Run all tests
bun test

# Run validation tests only
bun test validation

# Run specific test file
bun test schemas.test.ts
```

### Security Test Categories

**1. XSS Prevention Tests**

```typescript
it('should reject script tag attempts', () => {
  const result = answerInputSchema.safeParse('<script>alert("XSS")</script>')
  expect(result.success).toBe(false)
})
```

**2. Injection Prevention Tests**

```typescript
it('should reject SQL injection attempts', () => {
  const result = uuidSchema.safeParse("'; DROP TABLE users; --")
  expect(result.success).toBe(false)
})
```

**3. Type Coercion Tests**

```typescript
it('should not coerce types', () => {
  const result = preferencesSchema.safeParse({ theme: 123 })
  expect(result.success).toBe(false)
})
```

**4. DoS Prevention Tests**

```typescript
it('should reject excessively long inputs', () => {
  const longInput = 'a'.repeat(10000)
  const result = answerInputSchema.safeParse(longInput)
  expect(result.success).toBe(false)
})
```

---

## Developer Guidelines

### Secure Coding Checklist

When implementing new features:

- [ ] **Validate all user input** with Zod schemas
- [ ] **Sanitize input** even if validated (defense-in-depth)
- [ ] **Never use** `dangerouslySetInnerHTML` or `set:html`
- [ ] **Apply security headers** to all API responses
- [ ] **Use parameterized queries** (automatic with Supabase)
- [ ] **Test for XSS** and injection vulnerabilities
- [ ] **Limit input length** to prevent DoS
- [ ] **Use TypeScript** strict mode (enforced)

### Input Validation Pattern

**ALWAYS:**

```typescript
// 1. Define Zod schema
const myInputSchema = z.object({
  field: z.string().max(100).regex(/^[a-zA-Z0-9]*$/)
})

// 2. Validate input
const result = myInputSchema.safeParse(userInput)
if (!result.success) {
  return { error: result.error.message }
}

// 3. Use validated data
const validated = result.data
```

**NEVER:**

```typescript
// ❌ Don't trust user input directly
const value = request.body.field // No validation!

// ❌ Don't construct SQL manually
const query = `SELECT * FROM table WHERE id = ${userInput}`

// ❌ Don't set innerHTML
element.innerHTML = userInput
```

### Output Escaping Pattern

**ALWAYS rely on framework auto-escaping:**

```astro
<!-- ✅ GOOD: Auto-escaped -->
<div>{userInput}</div>

<!-- ✅ GOOD: Auto-escaped in SolidJS -->
<div>{props.userInput}</div>
```

**NEVER bypass escaping:**

```astro
<!-- ❌ BAD: Bypasses escaping -->
<div set:html={userInput} />

<!-- ❌ BAD: Manual HTML construction -->
<div innerHTML={userInput} />
```

### API Security Pattern

```typescript
export const POST: APIRoute = async ({ request }) => {
  const isDev = import.meta.env.DEV

  // 1. Validate
  const body = await request.json()
  const validation = mySchema.safeParse(body)
  if (!validation.success) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: createSecurityHeaders(isDev, { 'Content-Type': 'application/json' })
    })
  }

  // 2. Sanitize (optional, for defense-in-depth)
  const sanitized = sanitizeInput(validation.data.field)

  // 3. Process safely
  const result = await processData(sanitized)

  // 4. Return with security headers
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: createSecurityHeaders(isDev, { 'Content-Type': 'application/json' })
  })
}
```

---

## Security Incident Response

### Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security concerns to project maintainers
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Security Audit Checklist

Perform regular security audits:

- [ ] Review all API endpoints for proper validation
- [ ] Check CSP headers in production
- [ ] Verify rate limiting is active
- [ ] Test XSS prevention with OWASP XSS vectors
- [ ] Audit database RLS policies
- [ ] Review session management security
- [ ] Check for outdated dependencies (`bun audit`)
- [ ] Verify HTTPS enforcement in production

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Zod Documentation](https://zod.dev/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

---

**Document Version:** 1.0
**Last Review:** 2025-11-08
**Next Review:** 2026-02-08
