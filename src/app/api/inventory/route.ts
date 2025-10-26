import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// GET /api/inventory - Get all inventory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    let inventory;
    if (location) {
      inventory = await database.getInventoryByLocation(location);
    } else {
      inventory = await database.getInventory();
    }
    
    return NextResponse.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('GET /api/inventory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Update inventory
export async function POST(request: NextRequest) {
  try {
    const { sku, store_location, current_stock, notes } = await request.json();
    
    if (!sku || !store_location || current_stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'SKU, store location, and current stock are required' },
        { status: 400 }
      );
    }

    const result = await database.updateInventory(sku, store_location, current_stock, notes);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/inventory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
