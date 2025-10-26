import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-factory';
import { Transaction } from '@/types';

// GET /api/transactions - Get transactions for a period
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get('periode'); // YYYY-MM
    const limit = searchParams.get('limit');

    // If no periode provided, get all transactions (for customer list)
    if (!periode) {
      const transactions = await database.getAllTransactions();
      return NextResponse.json({
        success: true,
        data: transactions
      });
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
    console.log('Received transaction data:', transaction);
    
    const result = await database.addTransaction(transaction);
    console.log('Database result:', result);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      console.error('Transaction validation failed:', result.error);
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