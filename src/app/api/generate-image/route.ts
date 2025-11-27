import { NextResponse } from 'next/server';
import { veniceClient } from '@/lib/venice';

export async function POST(request: Request) {
  try {
    const { prompt, modelId, style } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Default to venice-sd35 which is more reliable
    const selectedModel = modelId || 'venice-sd35';

    // Append style to the prompt
    const finalPrompt = style ? `${prompt}, ${style} style` : prompt;

    // Build request payload - minimal params for maximum compatibility
    const payload: Record<string, any> = {
      model: selectedModel,
      prompt: finalPrompt,
      width: 1024,
      height: 1024,
    };

    // Only add steps for models that support it (not qwen-image)
    if (selectedModel !== 'qwen-image') {
      payload.steps = 25;
    }

    const response = await veniceClient.post('/image/generate', payload);

    // The response should have images array
    if (response.data && response.data.images && response.data.images.length > 0) {
      const base64Image = response.data.images[0];
      // Return as a data URL
      return NextResponse.json({ 
        imageUrl: `data:image/webp;base64,${base64Image}` 
      });
    } else {
      throw new Error('No image returned from API');
    }

  } catch (error: any) {
    console.error('Image generation error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error?.message || 'Failed to generate image' },
      { status: error.response?.status || 500 }
    );
  }
}
