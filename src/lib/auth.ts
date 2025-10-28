import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  username: string;
  exp: number;
  iat: number;
  jti: string;
}

// Verify JWT token from request
export function verifyToken(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET || 'peticash-secret-key-2024';

    // Verify and decode the token
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as AuthUser;
    return decoded;

  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(request: NextRequest): boolean {
  const user = verifyToken(request);
  return user !== null;
}

// Get authenticated user
export function getAuthenticatedUser(request: NextRequest): AuthUser | null {
  return verifyToken(request);
}

// Generate password hash for setup
export async function generatePasswordHash(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  const saltRounds = 12; // High security
  return await bcrypt.hash(password, saltRounds);
}
