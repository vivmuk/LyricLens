import { NextResponse } from 'next/server';
import { createVeniceClient } from '@/lib/venice';

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-venice-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 401 });
    }
    const veniceClient = createVeniceClient(apiKey);
    const { imageUrl, motionPrompt, modelId } = await request.json();

    if (!motionPrompt) {
      return NextResponse.json({ error: 'Motion Prompt is required' }, { status: 400 });
    }

    // Default model if not provided
    const selectedModel = modelId || 'veo3-fast-image-to-video';

    // Prepare payload
    const payload: any = {
      model: selectedModel,
      prompt: motionPrompt,
      duration: 10, // Default to 10s as per our segments
    };

    if (imageUrl) {
      // We pass the full data URI as image_url if present
      payload.image_url = imageUrl;
    }

    console.log('Queueing video generation with model:', selectedModel);

    // 1. Queue the job
    const queueResponse = await veniceClient.post('/video/queue', payload);
    const queueId = queueResponse.data.queue_id;

    if (!queueId) {
      throw new Error('No queue_id returned from Venice API');
    }

    // 2. Poll for results
    // We'll limit polling to 90 seconds (18 attempts * 5s)
    const MAX_RETRIES = 18;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      attempts++;

      const retrieveResponse = await veniceClient.post('/video/retrieve', {
        queue_id: queueId,
        delete_media_on_completion: true
      });

      // Check if content type is video or if status indicates completion
      const contentType = retrieveResponse.headers['content-type'];

      if (contentType === 'video/mp4' || contentType === 'application/octet-stream') {
        // It's the video binary!
        // Convert to base64 to send back to client
        const videoBuffer = Buffer.from(retrieveResponse.data, 'binary');
        const videoBase64 = videoBuffer.toString('base64');
        return NextResponse.json({ videoUrl: `data:video/mp4;base64,${videoBase64}` });
      }

      // Check JSON status if it's still JSON
      if (retrieveResponse.data && retrieveResponse.data.status === 'PROCESSING') {
        continue;
      }

      if (retrieveResponse.data && retrieveResponse.data.status === 'FAILED') {
        throw new Error(`Video generation failed: ${JSON.stringify(retrieveResponse.data)}`);
      }
    }

    return NextResponse.json({ error: 'Timeout waiting for video generation' }, { status: 504 });

  } catch (error: any) {
    console.error('Video generation error:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      return NextResponse.json({ error: 'Endpoint not found. Check API docs.' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: error.response?.status || 500 }
    );
  }
}
