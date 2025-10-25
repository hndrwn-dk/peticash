import { DatabaseService } from './database';
import { PostgresDatabaseService } from './postgres-database';

// Database factory that chooses the right database based on environment
export function createDatabase() {
  // Use PostgreSQL if Vercel Postgres environment variables are available
  const hasPostgresUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  
  console.log('🔍 Database selection:', {
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_URL: process.env.POSTGRES_URL ? 'present' : 'missing',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'present' : 'missing'
  });
  
  if (hasPostgresUrl) {
    console.log('🐘 Using PostgreSQL database');
    try {
      return new PostgresDatabaseService();
    } catch (error) {
      console.error('❌ PostgreSQL initialization failed, falling back to SQLite:', error);
      return new DatabaseService();
    }
  } else {
    console.log('📁 Using SQLite database');
    return new DatabaseService();
  }
}

// Export the database instance
export const database = createDatabase();