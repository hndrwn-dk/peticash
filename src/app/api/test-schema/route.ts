import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET /api/test-schema - Check actual PostgreSQL column names
export async function GET(request: NextRequest) {
  try {
    // Get column information from PostgreSQL
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `;

    // Also get a sample product to see actual field names
    const sampleProduct = await sql`SELECT * FROM products LIMIT 1`;

    return NextResponse.json({
      success: true,
      schema: result.rows,
      sample_product: sampleProduct.rows[0] || null,
      sample_keys: sampleProduct.rows[0] ? Object.keys(sampleProduct.rows[0]) : []
    });

  } catch (error) {
    console.error('Schema test error:', error);
    return NextResponse.json(
      { success: false, error: `Schema test failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}