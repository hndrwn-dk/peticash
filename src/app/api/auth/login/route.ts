import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Rate limiting store (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// POST /api/auth/login - Authenticate user with security measures
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Rate limiting check
    const now = Date.now();
    const attempts = loginAttempts.get(clientIP);
    
    if (attempts) {
      if (attempts.count >= MAX_ATTEMPTS) {
        const timeSinceLastAttempt = now - attempts.lastAttempt;
        if (timeSinceLastAttempt < LOCKOUT_DURATION) {
          const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
          return NextResponse.json(
            { 
              success: false, 
              error: `Terlalu banyak percobaan login. Coba lagi dalam ${remainingTime} menit.` 
            },
            { status: 429 }
          );
        } else {
          // Reset attempts after lockout period
          loginAttempts.delete(clientIP);
        }
      }
    }

    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Validate input length and characters
    if (username.length > 50 || password.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Input terlalu panjang' },
        { status: 400 }
      );
    }

    // Get credentials from environment variables or use defaults
    const expectedUsername = process.env.AUTH_USERNAME || 'peticash_manager_2024';
    const expectedPasswordHash = process.env.AUTH_PASSWORD_HASH || '$2a$12$2SmcKY9k0V8JKje2DM6rGeA4b6IQy/VFDgrBKXfIM5BHoaOvEGRjC'; // 'PeticashSecure2024!'
    const jwtSecret = process.env.JWT_SECRET || 'peticash-secret-key-2024';

    // Validate username
    if (username !== expectedUsername) {
      // Record failed attempt
      const currentAttempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
      loginAttempts.set(clientIP, { 
        count: currentAttempts.count + 1, 
        lastAttempt: now 
      });
      
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Validate password with bcrypt
    const isValidPassword = await bcrypt.compare(password, expectedPasswordHash);
    if (!isValidPassword) {
      // Record failed attempt
      const currentAttempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
      loginAttempts.set(clientIP, { 
        count: currentAttempts.count + 1, 
        lastAttempt: now 
      });
      
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(clientIP);

    // Generate secure JWT token
    const token = jwt.sign(
      { 
        username, 
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours (shorter for security)
        jti: crypto.randomUUID() // Unique token ID for revocation
      },
      jwtSecret,
      { algorithm: 'HS256' }
    );

    // Create response with token
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        username,
        expiresIn: 8 * 60 * 60 // 8 hours in seconds
      }
    });

    // Set secure HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    });

    // Log successful login
    return response;

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}
