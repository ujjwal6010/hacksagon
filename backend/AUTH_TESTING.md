# Janani Auth API — cURL Examples

## Signup Examples

### Signup with email
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sharma",
    "email": "doctor@example.com",
    "password": "SecurePassword123"
  }'
```

### Signup with phone
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Priya Singh",
    "phoneNumber": "+91 9876543210",
    "password": "Password456"
  }'
```

### Signup with both email and phone
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Patient A",
    "email": "patient@example.com",
    "phoneNumber": "+91 9123456789",
    "password": "TestPass789"
  }'
```

## Login Examples

### Login with email
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "doctor@example.com",
    "password": "SecurePassword123"
  }'
```

### Login with phone
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+91 9876543210",
    "password": "Password456"
  }'
```

## Expected Responses

### Success Response (201 Created)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Dr. Sharma",
    "email": "doctor@example.com",
    "phoneNumber": null
  }
}
```

### Auth Success Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Dr. Sharma",
    "email": "doctor@example.com",
    "phoneNumber": null
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Email already in use"
}
```

### Auth Error Response (401 Unauthorized)
```json
{
  "error": "Invalid identifier or password"
}
```

## Validation Rules Enforced

- `name` required
- `password` minimum 6 characters
- At least one of `email` or `phoneNumber` required
- `email` and `phoneNumber` must be unique
- Phone number must be 7-15 digits
- Email must be valid format
