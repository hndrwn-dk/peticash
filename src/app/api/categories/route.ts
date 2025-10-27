import { NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// GET /api/categories - Get all unique categories from products
export async function GET() {
  try {
    const products = await database.getProducts();
    
    // Extract unique categories, filter out empty/null values
    const categories = Array.from(
      new Set(
        products
          .map((product: any) => product.kategori)
          .filter((kategori: string) => kategori && kategori.trim() !== '')
      )
    ).sort();
    
    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}