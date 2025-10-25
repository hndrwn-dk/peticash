import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// DELETE /api/products/[sku] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const { sku } = params;

    if (!sku) {
      return NextResponse.json(
        { success: false, error: 'SKU is required' },
        { status: 400 }
      );
    }

    const result = await database.deleteProduct(sku);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('DELETE /api/products/[sku] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}