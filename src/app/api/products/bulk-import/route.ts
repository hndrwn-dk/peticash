import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// POST /api/products/bulk-import - Bulk import products from CSV
export async function POST(request: NextRequest) {
  try {
    const { csvText } = await request.json();
    
    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'CSV text is required' },
        { status: 400 }
      );
    }

    const result = await database.bulkImportProducts(csvText);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/products/bulk-import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import products' },
      { status: 500 }
    );
  }
}