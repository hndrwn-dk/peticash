import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// GET /api/auth/verify - Verify authentication token
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Konfigurasi autentikasi tidak lengkap' },
        { status: 500 }
      );
    }

    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;
      
      return NextResponse.json({
        success: true,
        data: {
          username: decoded.username,
          exp: decoded.exp,
          iat: decoded.iat
        }
      });

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { success: false, error: 'Token tidak valid atau telah kedaluwarsa' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat verifikasi token' },
      { status: 500 }
    );
  }
}
