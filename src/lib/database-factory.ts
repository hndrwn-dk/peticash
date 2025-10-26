import { DatabaseService } from './database';
import { PostgresDatabaseService } from './postgres-database';

// Database factory that chooses the right database based on environment
export function createDatabase() {
  // Use PostgreSQL if Vercel Postgres environment variables are available
  const hasPostgresUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  
  console.log('🔍 Database selection:', {
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_URL: process.env.POSTGRES_URL ? 'present' : 'missing',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'present' : 'missing',
    VERCEL: process.env.VERCEL ? 'present' : 'missing'
  });
  
  if (hasPostgresUrl) {
    console.log('🐘 Using PostgreSQL database');
    try {
      const postgresService = new PostgresDatabaseService();
      console.log('✅ PostgreSQL service created successfully');
      return postgresService;
    } catch (error) {
      console.error('❌ PostgreSQL initialization failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      console.log('📁 Falling back to SQLite database');
      return new DatabaseService();
    }
  } else {
    console.log('📁 Using SQLite database');
    return new DatabaseService();
  }
}

// Export the database instance
export const database = createDatabase();