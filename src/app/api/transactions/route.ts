import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { Transaction } from '@/types';

// GET /api/transactions - Get transactions for a period
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get('periode'); // YYYY-MM
    const limit = searchParams.get('limit');

    if (!periode) {
      return NextResponse.json(
        { success: false, error: 'Periode parameter is required (YYYY-MM)' },
        { status: 400 }
      );
    }

    const limitNum = limit ? parseInt(limit) : undefined;
    const transactions = await database.getTransactions(periode, limitNum);
    
    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Add new transaction
export async function POST(request: NextRequest) {
  try {
    const transaction: Transaction = await request.json();
    
    const result = await database.addTransaction(transaction);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save transaction' },
      { status: 500 }
    );
  }
}