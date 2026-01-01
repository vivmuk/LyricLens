import { NextResponse } from 'next/server';
import { createVeniceClient } from '@/lib/venice';

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get('x-venice-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 401 });
    }
    const veniceClient = createVeniceClient(apiKey);
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
