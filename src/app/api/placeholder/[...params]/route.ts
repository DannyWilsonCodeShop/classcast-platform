import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [width, height] = params.params;
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || '?';
    const bgColor = searchParams.get('bg') || '6b7280'; // gray-500
    const textColor = searchParams.get('color') || 'ffffff'; // white

    const w = parseInt(width) || 400;
    const h = parseInt(height) || 300;

    // Create SVG placeholder
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#${bgColor}"/>
        <text 
          x="50%" 
          y="50%" 
          dominant-baseline="middle" 
          text-anchor="middle" 
          fill="#${textColor}" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-size="${Math.min(w, h) / 8}"
          font-weight="500"
        >
          ${text.slice(0, 3)}
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating placeholder:', error);
    
    // Return a simple fallback SVG
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#6b7280"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="24">📹</text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
}