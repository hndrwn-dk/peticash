import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';
import jwt from 'jsonwebtoken';

// POST /api/auth/reset-password - Reset password (requires current password)
export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password baru minimal 8 karakter' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Konfirmasi password tidak sesuai' },
        { status: 400 }
      );
    }

    // Get current credentials from environment variables (mandatory for security)
    const expectedUsername = process.env.AUTH_USERNAME;
    const currentPasswordHash = process.env.AUTH_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    // Validate that all required environment variables are set
    if (!expectedUsername || !currentPasswordHash || !jwtSecret) {
      return NextResponse.json(
        { success: false, error: 'Konfigurasi autentikasi tidak lengkap' },
        { status: 500 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Password saat ini salah' },
        { status: 401 }
      );
    }

    // Generate new password hash
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // In a real application, you would save this to a database
    // For now, we'll return the new hash for manual update
    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
      data: {
        newPasswordHash,
        instructions: [
          '1. Copy the newPasswordHash value above',
          '2. Set it as AUTH_PASSWORD_HASH environment variable',
          '3. Redeploy your application',
          '4. New password will be active after deployment'
        ],
        newCredentials: {
          username: expectedUsername,
          password: newPassword
        }
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengubah password' },
      { status: 500 }
    );
  }
}

