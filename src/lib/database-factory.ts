import { DatabaseService } from './database';
import { PostgresDatabaseService } from './postgres-database';

// Database factory that chooses the right database based on environment
export function createDatabase() {
  // Use PostgreSQL if Vercel Postgres environment variables are available
  const hasPostgresUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  
  console.log('🔍 Database selection:', {
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_URL: process.env.POSTGRES_URL ? 'present' : 'missing',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'present' : 'missing',
    DATABASE_URL: process.env.DATABASE_URL ? 'present' : 'missing',
    VERCEL: process.env.VERCEL ? 'present' : 'missing'
  });
  
  // In production/Vercel, always try PostgreSQL first
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    console.log('🐘 Production environment - forcing PostgreSQL');
    const postgresService = new PostgresDatabaseService();
    console.log('✅ PostgreSQL service created successfully');
    return postgresService;
  }
  
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

// Lazy database instance - only created when first accessed
let _database: any = null;

export function getDatabase() {
  if (!_database) {
    _database = createDatabase();
  }
  return _database;
}

// For backward compatibility, export database as a getter
export const database = new Proxy({} as any, {
  get(target, prop) {
    const db = getDatabase();
    return db[prop];
  }
});