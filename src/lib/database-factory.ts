import { PostgresDatabaseService } from './postgres-database';

// Database factory - PostgreSQL only, no fallbacks
export function createDatabase() {
  console.log('🔍 Database configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_URL: process.env.POSTGRES_URL ? 'present' : 'missing',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'present' : 'missing',
    DATABASE_URL: process.env.DATABASE_URL ? 'present' : 'missing',
    VERCEL: process.env.VERCEL ? 'present' : 'missing'
  });
  
  // Validate PostgreSQL environment variables
  const hasPostgresUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  
  if (!hasPostgresUrl) {
    const error = 'PostgreSQL environment variables not found. Please set POSTGRES_URL, POSTGRES_PRISMA_URL, or DATABASE_URL.';
    console.error('❌', error);
    throw new Error(error);
  }
  
  console.log('🐘 Initializing PostgreSQL database');
  const postgresService = new PostgresDatabaseService();
  console.log('✅ PostgreSQL service created successfully');
  return postgresService;
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