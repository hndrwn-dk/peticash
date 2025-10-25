import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// GET /api/db-status - Check database status and persistence warning
export async function GET(request: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    // Get basic stats
    const products = await database.getProducts();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const transactions = await database.getTransactions(currentMonth);

    // Check what database is actually being used
    const hasPostgresUrl = !!process.env.POSTGRES_URL;
    const hasPostgresPrismaUrl = !!process.env.POSTGRES_PRISMA_URL;
    const usingPostgres = hasPostgresUrl || hasPostgresPrismaUrl;

    return NextResponse.json({
      success: true,
      data: {
        environment: isProduction ? 'production' : 'development',
        platform: isVercel ? 'vercel' : 'local',
        database_type: usingPostgres ? 'postgresql' : 'sqlite',
        database_path: usingPostgres ? 
          (process.env.POSTGRES_URL ? 'postgresql://***' : 'postgresql://***') : 
          (isProduction ? '/tmp/bookkeeper.db' : './data/bookkeeper.db'),
        is_ephemeral: !usingPostgres && isProduction && isVercel,
        warning: !usingPostgres && isProduction && isVercel ? 
          'Database is using ephemeral storage. Data will be lost on deployment/restart.' : null,
        environment_variables: {
          POSTGRES_URL: hasPostgresUrl ? 'present' : 'missing',
          POSTGRES_PRISMA_URL: hasPostgresPrismaUrl ? 'present' : 'missing'
        },
        stats: {
          products_count: products.length,
          current_month_transactions: transactions.length,
          current_month: currentMonth
        },
        recommendations: !usingPostgres && isProduction && isVercel ? [
          'Use Vercel Postgres for persistent storage',
          'Consider PlanetScale or Supabase for production',
          'Implement data backup/restore functionality'
        ] : null
      }
    });

  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json(
      { success: false, error: `Status check failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}