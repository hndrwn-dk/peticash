import { DatabaseService } from './database';
import { PostgresDatabaseService } from './postgres-database';

// Database factory that chooses the right database based on environment
export function createDatabase() {
  // Use PostgreSQL if Vercel Postgres environment variables are available
  if (process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL) {
    console.log('🐘 Using PostgreSQL database');
    return new PostgresDatabaseService();
  } else {
    console.log('📁 Using SQLite database');
    return new DatabaseService();
  }
}

// Export the database instance
export const database = createDatabase();