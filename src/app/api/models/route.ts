import { NextResponse } from 'next/server';
import { veniceClient } from '@/lib/venice';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Fetch models with optional type filter
    const url = type ? `/models?type=${type}` : '/models';
    const response = await veniceClient.get(url);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching models:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: error.response?.status || 500 }
    );
  }
}
