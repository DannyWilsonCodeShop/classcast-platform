import { NextRequest, NextResponse } from 'next/server';
import { ClassCodeGenerator } from '@/lib/class-code-generator';

export async function POST(request: NextRequest) {
  try {
    const { existingCodes = [], options = {} } = await request.json();

    // Generate a unique class code
    const uniqueCode = ClassCodeGenerator.generateUniqueCode(existingCodes, {
      length: 6,
      includeLetters: true,
      includeNumbers: true,
      excludeSimilar: true,
      ...options
    });

    return NextResponse.json({
      success: true,
      code: uniqueCode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating class code:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate unique class code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '1');
    const type = searchParams.get('type') || 'standard';

    let codes: string[] = [];

    switch (type) {
      case 'readable':
        codes = Array.from({ length: count }, () => ClassCodeGenerator.generateReadableCode());
        break;
      case 'numeric':
        codes = Array.from({ length: count }, () => ClassCodeGenerator.generateNumericCode(6));
        break;
      case 'mixed':
        codes = Array.from({ length: count }, () => ClassCodeGenerator.generateMixedCaseCode(6));
        break;
      default:
        codes = ClassCodeGenerator.generateUniqueCodes(count, {
          length: 6,
          includeLetters: true,
          includeNumbers: true,
          excludeSimilar: true
        });
    }

    return NextResponse.json({
      success: true,
      codes,
      count: codes.length,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating class codes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate class codes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
