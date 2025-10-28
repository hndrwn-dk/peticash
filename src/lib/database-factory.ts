import { PostgresDatabaseService } from './postgres-database';

// Database factory - PostgreSQL only, no fallbacks
export function createDatabase() {
  // Validate PostgreSQL environment variables
  const hasPostgresUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  
  if (!hasPostgresUrl) {
    const error = 'PostgreSQL environment variables not found. Please set POSTGRES_URL, POSTGRES_PRISMA_URL, or DATABASE_URL.';
    throw new Error(error);
  }
  
  const postgresService = new PostgresDatabaseService();
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