# 🔐 Authentication Setup Guide

## Overview
Peticash now includes a secure authentication system with password protection. This guide will help you set up the authentication for your deployment.

## Security Features
- ✅ **Password Hashing**: Uses bcrypt with 12 salt rounds
- ✅ **JWT Tokens**: Secure token-based authentication
- ✅ **Rate Limiting**: 5 failed attempts = 15-minute lockout
- ✅ **HTTP-Only Cookies**: Prevents XSS attacks
- ✅ **Session Management**: 8-hour token expiration
- ✅ **Input Validation**: Prevents injection attacks
- ✅ **IP Tracking**: Tracks failed login attempts by IP

## Setup Instructions

### 1. Generate Password Hash
Run the setup script to generate a secure password hash:

```bash
node scripts/setup-auth.js yourSecurePassword123
```

This will output something like:
```
🔐 Password hash generated successfully!

Add these environment variables to your .env.local file:

AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=$2a$12$xyz123...
JWT_SECRET=abc123def456...
```

### 2. Set Environment Variables
Add these variables to your `.env.local` file:

```env
# Authentication
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=$2a$12$your_generated_hash_here
JWT_SECRET=your_generated_jwt_secret_here
```

### 3. Deploy to Production
For production deployment (Vercel), add these environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the three variables above
4. Redeploy your application

## Default Credentials
- **Username**: `admin` (configurable via AUTH_USERNAME)
- **Password**: Whatever you set when running the setup script

## How It Works

### Login Flow
1. User enters username/password on `/login`
2. System validates credentials against environment variables
3. On success: Creates JWT token and sets HTTP-only cookie
4. User is redirected to dashboard

### Protected Routes
- All routes except `/login` require authentication
- Middleware checks for valid JWT token in cookies
- Invalid/expired tokens redirect to login page

### Logout
- Clears the authentication cookie
- Redirects to login page

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- Use strong, unique passwords
- Consider using a password manager

### Environment Variables
- Never commit `.env.local` to version control
- Use strong, random JWT secrets
- Rotate secrets periodically

### Production Considerations
- Use HTTPS in production
- Monitor failed login attempts
- Consider implementing 2FA for enhanced security

## Troubleshooting

### Common Issues

**"Konfigurasi autentikasi tidak lengkap"**
- Check that all three environment variables are set
- Verify the password hash was generated correctly

**"Token tidak valid atau telah kedaluwarsa"**
- Token has expired (8 hours)
- User needs to log in again

**"Terlalu banyak percobaan login"**
- Rate limiting activated
- Wait 15 minutes or check for brute force attempts

### Testing Authentication
1. Visit `/login` - should show login form
2. Try wrong credentials - should show error
3. Try correct credentials - should redirect to dashboard
4. Visit any protected route - should work
5. Click logout - should redirect to login

## File Structure
```
src/
├── app/
│   ├── login/page.tsx          # Login page
│   └── api/auth/               # Authentication API
│       ├── login/route.ts      # Login endpoint
│       ├── logout/route.ts     # Logout endpoint
│       └── verify/route.ts     # Token verification
├── lib/
│   └── auth.ts                 # Authentication utilities
├── middleware.ts               # Route protection
└── components/
    └── Navigation.tsx          # Updated with logout button
```

## Support
If you encounter any issues with the authentication system, check:
1. Environment variables are correctly set
2. Password hash was generated properly
3. JWT secret is strong and unique
4. All dependencies are installed (`npm install`)

The authentication system is now ready for production use! 🚀
