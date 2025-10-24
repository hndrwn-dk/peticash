import { NextRequest, NextResponse } from 'next/server';
import { bookkeeper } from '@/lib/bookkeeper';

// GET /api/reports/[periode] - Generate monthly report
export async function GET(
  request: NextRequest,
  { params }: { params: { periode: string } }
) {
  try {
    const { periode } = params;
    
    // Validate periode format (YYYY-MM)
    const periodeRegex = /^\d{4}-\d{2}$/;
    if (!periodeRegex.test(periode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid periode format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    const result = await bookkeeper.generateMonthlyReport(periode);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error) {
    console.error('GET /api/reports/[periode] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}