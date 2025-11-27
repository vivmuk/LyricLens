import { NextResponse } from 'next/server';
import { veniceClient } from '@/lib/venice';

// Model-specific step limits based on Venice API docs
const MODEL_STEP_LIMITS: Record<string, number> = {
  'qwen-image': 8,
  'venice-sd35': 30,
  'hidream': 50,
  'flux-dev': 30,
  'flux-dev-uncensored': 30,
  'lustify-sdxl': 50,
  'lustify-v7': 50,
  'wai-Illustrious': 30,
};

export async function POST(request: Request) {
  try {
    const { prompt, modelId, style } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const selectedModel = modelId || 'qwen-image';
    
    // Get the max steps for this model, default to 8 (safest)
    const maxSteps = MODEL_STEP_LIMITS[selectedModel] || 8;
    
    // Use a reasonable number of steps within the limit
    const steps = Math.min(maxSteps, 8);

    // Append style to the prompt
    const finalPrompt = style ? `${prompt}, ${style} style` : prompt;

    const response = await veniceClient.post('/image/generate', {
      model: selectedModel,
      prompt: finalPrompt,
      width: 1280, // 16:9 aspect ratio for video
      height: 720,
      steps: steps,
      cfg_scale: 7.5,
      return_binary: false, // We want base64 for easy frontend display
    });

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
