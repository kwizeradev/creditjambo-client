## Models Overview

### User

Stores customer and admin user information.

**Fields:**

- `id`: Unique identifier (UUID)
- `email`: User email (unique)
- `name`: User's full name
- `passwordHash`: SHA-512 hashed password
- `salt`: Random salt for password hashing
- `role`: USER or ADMIN
- `createdAt`: Registration timestamp
- `updatedAt`: Last update timestamp

### Device

Tracks customer devices for verification.

**Fields:**

- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `deviceId`: Unique device identifier
- `deviceInfo`: Device information string
- `verified`: Admin verification status
- `createdAt`: Device registration timestamp
- `updatedAt`: Last update timestamp

### Account

Stores customer account balances.

**Fields:**

- `id`: Unique identifier (UUID)
- `userId`: Reference to User (one-to-one)
- `balance`: Current balance (Decimal 15,2)
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### Transaction

Records all deposits and withdrawals.

**Fields:**

- `id`: Unique identifier (UUID)
- `accountId`: Reference to Account
- `type`: DEPOSIT or WITHDRAW
- `amount`: Transaction amount (Decimal 15,2)
- `description`: Optional transaction description
- `createdAt`: Transaction timestamp

### Session

Manages user authentication sessions.

**Fields:**

- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `deviceId`: Reference to Device
- `refreshTokenHash`: Hashed refresh token
- `lastActivityAt`: Last activity timestamp
- `expiresAt`: Session expiration timestamp
- `createdAt`: Session creation timestamp

### PushToken

Stores Expo push notification tokens.

**Fields:**

- `id`: Unique identifier (UUID)
- `userId`: Reference to User
- `token`: Expo push token (unique)
- `platform`: Platform identifier (ios/android)
- `createdAt`: Token creation timestamp
- `updatedAt`: Last update timestamp

## Relationships

- User → Device (one-to-many)
- User → Account (one-to-one)
- User → Session (one-to-many)
- User → PushToken (one-to-many)
- Account → Transaction (one-to-many)
- Device → Session (one-to-many)

## Indexes

Indexes are created for optimal query performance:

- User: email
- Device: userId, deviceId, verified
- Transaction: accountId, createdAt, type
- Session: userId, deviceId, expiresAt
- PushToken: userId
