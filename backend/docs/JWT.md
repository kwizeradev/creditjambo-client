# JWT Authentication

## Token Strategy

CJSavings uses a dual-token authentication system:

1. **Access Token** (Short-lived - 15 minutes)
   - Used for API authentication
   - Contains user information
   - Stored in memory (mobile) or sessionStorage (web)

2. **Refresh Token** (Long-lived - 7 days)
   - Used to obtain new access tokens
   - Contains minimal information
   - Stored securely (SecureStore on mobile, httpOnly cookie on web)

## Token Structure

### Access Token Payload

```typescript
{
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  deviceId: string;
  iss: 'creditjambo';
  aud: 'creditjambo-api';
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}
```

### Refresh Token Payload

```typescript
{
  userId: string;
  deviceId: string;
  sessionId: string;
  iss: 'creditjambo';
  aud: 'creditjambo-api';
  exp: number;
  iat: number;
}
```

## Authentication Flow

### 1. Login

```
Client                  Server
  |                       |
  |---> POST /login ----->|
  |    (email, password)  |
  |                       | - Verify credentials
  |                       | - Create session
  |                       | - Generate tokens
  |<--- 200 OK -----------|
  |    (access, refresh)  |
  |                       |
  | Store tokens          |
```

### 2. API Request

```
Client                  Server
  |                       |
  |---> GET /balance ---->|
  |    Bearer <access>    |
  |                       | - Verify access token
  |                       | - Check device verified
  |                       | - Process request
  |<--- 200 OK -----------|
  |    (response data)    |
```

### 3. Token Refresh

```
Client                  Server
  |                       |
  | Access token expired  |
  |---> POST /refresh --->|
  |    (refresh token)    |
  |                       | - Verify refresh token
  |                       | - Check session valid
  |                       | - Generate new tokens
  |<--- 200 OK -----------|
  |    (new access token) |
  |                       |
  | Update access token   |
```

## Security Features

✅ **Separate Secrets**: Different secrets for access and refresh tokens  
✅ **Short-Lived Access**: 15-minute access tokens limit exposure  
✅ **Token Rotation**: Refresh tokens can be rotated on use  
✅ **Issuer Validation**: Tokens validated against 'cjsavings' issuer  
✅ **Audience Validation**: Tokens validated against 'cjsavings-api' audience  
✅ **Session Tracking**: Refresh tokens tied to database sessions  
✅ **Device Binding**: Tokens bound to specific devices

## Token Storage

### Mobile App (React Native)

- **Access Token**: In-memory only (lost on app close)
- **Refresh Token**: Expo SecureStore (encrypted storage)
- **Benefit**: Automatic logout on app close

### Web Admin

- **Access Token**: sessionStorage (cleared on browser close)
- **Refresh Token**: httpOnly cookie (not accessible via JavaScript)
- **Benefit**: XSS protection, automatic logout

## Token Validation

All protected endpoints must:

1. Extract token from `Authorization: Bearer <token>` header
2. Verify token signature
3. Check token not expired
4. Validate issuer and audience
5. Check device verification status
6. Validate session still active

## Error Handling

| Error             | Status | Description                    |
| ----------------- | ------ | ------------------------------ |
| Missing token     | 401    | No Authorization header        |
| Invalid token     | 401    | Malformed or tampered token    |
| Expired token     | 401    | Token past expiration time     |
| Unverified device | 403    | Device not verified by admin   |
| Invalid session   | 401    | Session expired or invalidated |

## Generating Strong Secrets

For production, generate cryptographically secure secrets:

```bash
# Generate access secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate refresh secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Store these in environment variables, never commit to git.
