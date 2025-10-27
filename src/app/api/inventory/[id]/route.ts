import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid inventory ID' },
        { status: 400 }
      );
    }

    const result = await database.deleteInventory(id);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('DELETE /api/inventory/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
