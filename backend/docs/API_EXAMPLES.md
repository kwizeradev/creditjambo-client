# API Usage Examples

## Authentication Flow

### 1. Register New User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "deviceId": "device-12345",
  "deviceInfo": "iPhone 14 Pro"
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Registration successful. Your device is pending admin verification.",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2024-10-27T..."
    },
    "device": {
      "id": "uuid",
      "deviceId": "device-12345",
      "verified": false
    },
    "devicePending": true
  }
}
```

### 2. Login with Unverified Device

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123",
  "deviceId": "device-12345"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Your device is pending admin verification...",
  "data": {
    "devicePending": true,
    "deviceId": "device-12345"
  }
}
```

### 3. Admin Verifies Device

_(Admin endpoint - to be implemented)_

```bash
PATCH /api/admin/devices/{deviceId}/verify
Authorization: Bearer {admin_token}
```

### 4. Login with Verified Device

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123",
  "deviceId": "device-12345"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2024-10-27T..."
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

## Error Responses

### Invalid Credentials (401)

```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

### Validation Error (400)

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Duplicate Email (409)

```json
{
  "status": "error",
  "message": "Email already registered"
}
```
