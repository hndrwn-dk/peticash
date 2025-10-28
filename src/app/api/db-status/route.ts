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

    // Validate PostgreSQL environment variables
    const hasPostgresUrl = !!process.env.POSTGRES_URL;
    const hasPostgresPrismaUrl = !!process.env.POSTGRES_PRISMA_URL;
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasAnyPostgresUrl = hasPostgresUrl || hasPostgresPrismaUrl || hasDatabaseUrl;

    if (!hasAnyPostgresUrl) {
      return NextResponse.json({
        success: false,
        error: 'PostgreSQL environment variables not found. Please set POSTGRES_URL, POSTGRES_PRISMA_URL, or DATABASE_URL.',
        data: {
          environment: isProduction ? 'production' : 'development',
          platform: isVercel ? 'vercel' : 'local',
          database_type: 'none',
          database_path: null,
          is_ephemeral: false,
          warning: 'PostgreSQL configuration required',
          environment_variables: {
            POSTGRES_URL: 'missing',
            POSTGRES_PRISMA_URL: 'missing',
            DATABASE_URL: 'missing'
          },
          stats: {
            products_count: 0,
            current_month_transactions: 0,
            current_month: currentMonth
          },
          recommendations: [
            'Set POSTGRES_URL environment variable',
            'Or set POSTGRES_PRISMA_URL environment variable', 
            'Or set DATABASE_URL environment variable'
          ]
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        environment: isProduction ? 'production' : 'development',
        platform: isVercel ? 'vercel' : 'local',
        database_type: 'postgresql',
        database_path: 'postgresql://***',
        is_ephemeral: false,
        warning: null,
        environment_variables: {
          POSTGRES_URL: hasPostgresUrl ? 'present' : 'missing',
          POSTGRES_PRISMA_URL: hasPostgresPrismaUrl ? 'present' : 'missing',
          DATABASE_URL: hasDatabaseUrl ? 'present' : 'missing'
        },
        stats: {
          products_count: products.length,
          current_month_transactions: transactions.length,
          current_month: currentMonth
        },
        recommendations: null
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Status check failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}