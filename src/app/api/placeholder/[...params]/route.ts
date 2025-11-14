import { NextRequest, NextResponse } from 'next/server';

// GET /api/placeholder/[width]/[height] - Generate placeholder images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    const { params: pathParams } = await params;
    const [width, height] = pathParams;
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    
    // Parse dimensions
    const w = parseInt(width) || 100;
    const h = parseInt(height) || 100;
    
    // Validate dimensions
    if (w < 1 || w > 2000 || h < 1 || h > 2000) {
      return new NextResponse('Invalid dimensions', { status: 400 });
    }
    
    // Determine display text
    const displayText = text ? decodeURIComponent(text) : `${w}×${h}`;
    
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="10%" y="10%" width="80%" height="80%" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2" rx="8"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="${Math.min(w, h) * 0.12}" 
              fill="#6b7280"
              font-weight="500">
          ${displayText}
        </text>
      </svg>
    `.trim();
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
    
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return new NextResponse('Error generating placeholder', { status: 500 });
  }
}
