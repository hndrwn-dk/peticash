import { NextRequest, NextResponse } from 'next/server';
import { bookkeeper } from '@/lib/bookkeeper';
import { Product } from '@/types';

// GET /api/products - List/search products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const barcode = searchParams.get('barcode') || undefined;

    const products = await bookkeeper.getProducts(q, barcode);
    
    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create/update product
export async function POST(request: NextRequest) {
  try {
    const product: Product = await request.json();
    
    const result = await bookkeeper.upsertProduct(product);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save product' },
      { status: 500 }
    );
  }
}