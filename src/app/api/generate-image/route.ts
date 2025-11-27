import { NextResponse } from 'next/server';
import { veniceClient } from '@/lib/venice';

// Models that should NOT have steps parameter passed
const NO_STEPS_MODELS = ['nano-banana-pro', 'qwen-image'];

export async function POST(request: Request) {
  try {
    const { prompt, modelId, style } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Default to nano-banana-pro (Nano Banana Pro)
    const selectedModel = modelId || 'nano-banana-pro';

    // Append style to the prompt
    const finalPrompt = style ? `${prompt}, ${style} style` : prompt;

    // Build request payload - minimal params for maximum compatibility
    const payload: Record<string, any> = {
      model: selectedModel,
      prompt: finalPrompt,
      width: 1024,
      height: 1024,
    };

    // Only add steps for models that support it
    if (!NO_STEPS_MODELS.includes(selectedModel)) {
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
