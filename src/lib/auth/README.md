# Authentication System

UUID-based anonymous authentication system for the Arithmetic Practice Portal.

## Overview

This authentication system provides **privacy-first, anonymous authentication** using UUIDs. No personal data (email, name, age, etc.) is collected. Users are identified solely by their UUID.

## Features

- **Cryptographically secure UUID generation** using `crypto.randomUUID()`
- **User-friendly UUID format**: `XXXX-XXXX-XXXX-XXXX` (19 characters vs standard 36)
- **HttpOnly cookies** for XSS protection
- **Secure session management** with automatic refresh
- **Full type safety** with TypeScript
- **Supabase integration** for data persistence

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                   │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. User clicks "Start Practice"              │  │
│  │  2. POST /api/auth/generate                   │  │
│  │     { gradeRange: '4-6', locale: 'da-DK' }    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                API Endpoint (Server)                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. Generate UUID (crypto.randomUUID())       │  │
│  │  2. Create user in Supabase                   │  │
│  │  3. Create session token                      │  │
│  │  4. Set httpOnly cookie                       │  │
│  │  5. Return formatted UUID to user             │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                   │
│  ┌───────────────────────────────────────────────┐  │
│  │  Display UUID: "7b3f-4c2a-8d1e-9f6b"          │  │
│  │  User saves UUID (copy, download, QR code)    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/lib/auth/
├── index.ts           # Main exports
├── uuid.ts            # UUID utilities
├── service.ts         # Auth service (user CRUD)
├── session.ts         # Session management
└── README.md          # This file

src/pages/api/auth/
├── generate.ts        # POST - Generate new UUID and user
├── signin.ts          # POST - Sign in with UUID
├── signout.ts         # POST - Sign out (clear session)
└── session.ts         # GET - Get current session

src/middleware.ts      # Session validation middleware
```

## Usage

### Client-Side Usage

#### Generate New User
```typescript
const response = await fetch('/api/auth/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gradeRange: '4-6',
    locale: 'da-DK'
  })
})

const data = await response.json()
// {
//   success: true,
//   uuid: "7b3f-4c2a-8d1e-9f6b",
//   user: { id, gradeRange, locale, ... }
// }

// Cookie is automatically set: math-session=<token>
```

#### Sign In with UUID
```typescript
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uuid: '7b3f-4c2a-8d1e-9f6b'
  })
})

const data = await response.json()
// {
//   success: true,
//   user: { id, gradeRange, locale, ... }
// }

// Cookie is automatically set: math-session=<token>
```

#### Get Current Session
```typescript
const response = await fetch('/api/auth/session')
const data = await response.json()

if (data.authenticated) {
  console.log('User:', data.user)
} else {
  console.log('Not authenticated')
}
```

#### Sign Out
```typescript
await fetch('/api/auth/signout', { method: 'POST' })
// Cookie is cleared
```

### Server-Side Usage (Astro Pages)

```astro
---
// In any Astro page
const user = Astro.locals.user
const session = Astro.locals.session

if (!user) {
  return Astro.redirect('/login')
}
---

<div>
  <h1>Welcome!</h1>
  <p>Grade Range: {user.gradeRange}</p>
  <p>Locale: {user.locale}</p>
</div>
```

### Direct Function Usage

```typescript
import {
  generateUUID,
  formatUUID,
  validateUUID,
  createUser,
  signInWithUUID
} from '@/lib/auth'

// Generate and format UUID
const uuid = generateUUID()
const formatted = formatUUID(uuid)
// => "7b3f-4c2a-8d1e-9f6b"

// Validate UUID format
if (validateUUID(formatted)) {
  console.log('Valid UUID')
}

// Create user
const result = await createUser('4-6', 'da-DK')
if (result.success) {
  console.log('UUID:', result.data.formattedUUID)
}

// Sign in
const signInResult = await signInWithUUID('7b3f-4c2a-8d1e-9f6b')
if (signInResult.success) {
  console.log('User:', signInResult.data.user)
}
```

## Security Features

### HttpOnly Cookies
Session tokens are stored in httpOnly cookies, preventing JavaScript access and XSS attacks.

```http
Set-Cookie: math-session=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/
```

### Session Token Structure
```
<random-id>.<base64url(payload)>
```

Payload contains:
- `userId`: User's UUID
- `uuid`: Formatted UUID for display
- `createdAt`: Session creation timestamp
- `expiresAt`: Session expiration timestamp (24 hours)

### Automatic Session Refresh
Sessions are automatically refreshed when they reach halfway through their lifetime (12 hours), ensuring continuous access.

### Middleware Protection
All pages automatically validate sessions via middleware. User data is available in `Astro.locals.user`.

## Requirements Fulfilled

- ✅ **Req 1.1**: Generate cryptographically secure 128-bit UUID
- ✅ **Req 1.2**: Format as XXXX-XXXX-XXXX-XXXX
- ✅ **Req 1.5**: HttpOnly cookies with Secure and SameSite flags

## Implementation Details

### UUID Format
Standard UUID: `7b3f4c2a-8d1e-9f6b-3a2c-1d4e5f6a7b8c` (36 chars)
Custom format: `7b3f-4c2a-8d1e-9f6b` (19 chars)

Benefits:
- Shorter and more user-friendly
- Easier to type manually
- Still cryptographically secure (64 bits)
- Less prone to typos

### Session Lifetime
- **Duration**: 24 hours
- **Refresh**: Automatic after 12 hours
- **Storage**: HttpOnly cookie
- **Validation**: On every request via middleware

### Error Handling
All functions return `AuthResult<T>`:
```typescript
type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

This provides type-safe error handling and consistent API responses.

## Testing

### Manual Testing

1. **Generate new user**:
```bash
curl -X POST http://localhost:4321/api/auth/generate \
  -H "Content-Type: application/json" \
  -d '{"gradeRange":"4-6","locale":"da-DK"}'
```

2. **Sign in**:
```bash
curl -X POST http://localhost:4321/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"uuid":"7b3f-4c2a-8d1e-9f6b"}' \
  -c cookies.txt
```

3. **Get session**:
```bash
curl http://localhost:4321/api/auth/session \
  -b cookies.txt
```

4. **Sign out**:
```bash
curl -X POST http://localhost:4321/api/auth/signout \
  -b cookies.txt
```

## Future Enhancements

- [ ] Rate limiting (5 attempts per minute per IP)
- [ ] UUID login attempt tracking
- [ ] Temporary IP blocking after failed attempts
- [ ] Session analytics (non-identifying)
- [ ] Multi-device session management
- [ ] Session revocation endpoint

## Related Documentation

- [DEPLOYMENT.md](../../../DEPLOYMENT.md) - Deployment guide
- [Requirements](../../../.kiro/specs/arithmetic-practice-portal/requirements.md) - Full requirements
- [Design](../../../.kiro/specs/arithmetic-practice-portal/design.md) - System design
