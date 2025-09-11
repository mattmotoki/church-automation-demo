import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Ensure Node.js runtime for filesystem access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hymnal = (searchParams.get('hymnal') || '').toLowerCase();

    if (!['umh', 'fws', 'thb'].includes(hymnal)) {
      return NextResponse.json({ error: 'Invalid hymnal parameter' }, { status: 400 });
    }

    // Directly read the hymn directory
    const hymnDir = path.join(process.cwd(), 'public', 'data', 'hymns', hymnal);
    
    if (!fs.existsSync(hymnDir)) {
      return NextResponse.json([], { status: 200 });
    }

    // Get all JSON files from the directory
    const files = fs.readdirSync(hymnDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        // Extract numbers for proper numeric sorting
        const numA = parseInt(a.replace('.json', ''));
        const numB = parseInt(b.replace('.json', ''));
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      });

    return NextResponse.json(files);
  } catch (err) {
    console.error('Error listing hymns:', err);
    return NextResponse.json({ error: 'Failed to list hymns' }, { status: 500 });
  }
}


