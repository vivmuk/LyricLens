import { NextResponse } from 'next/server';
import { createVeniceClient } from '@/lib/venice';

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-venice-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 401 });
    }
    const veniceClient = createVeniceClient(apiKey);
    const { lyrics, style, modelId } = await request.json();

    if (!lyrics) {
      return NextResponse.json({ error: 'Lyrics are required' }, { status: 400 });
    }

    // Use a model that supports response_format, or default to one that does
    // qwen3-4b and qwen3-235b support structured responses
    const selectedModel = modelId || 'gemini-3-flash-preview';

    const systemPrompt = `You are an expert Film Director and Visual Artist. 
Your goal is to turn song lyrics into a sequence of 10-second video scenes that form a cohesive Narrative Arc.
The user wants the video style to be: "${style || 'Cinematic'}".

Instructions:
1. Divide the lyrics into logical 10-second segments (roughly 2-4 lines each). If lines are long, use fewer.
2. **Narrative Consistency**: Ensure each scene creates a continuous visual story. Scene N should logically flow or cut to Scene N+1. Avoid disjointed random imagery.
3. For each segment, create a "Visual Prompt" for an AI image generator. Focus on subject, lighting, composition, and the specified style. Describe the scene vividly.
4. For each segment, create a "Motion Prompt" for an AI video generator. Use terms like "Slow pan right", "Zoom in", "Camera orbit", "Morphing shapes", "Follow subject". explicitly describe how the motion connects the current scene to the mood.
5. Return ONLY a valid JSON object with a "segments" array. No markdown, no extra text.


Example output format:
{"segments":[{"text":"lyrics here","visualPrompt":"detailed image description","motionPrompt":"camera movement"}]}
`;

    const response = await veniceClient.post('/chat/completions', {
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here are the lyrics to process:\n\n${lyrics}` }
      ],
      temperature: 0.7,
      max_completion_tokens: 4096,
    });

    const content = response.data.choices[0].message.content;

    // Parse the content to ensure it's valid JSON
    let parsedData;
    try {
      // Try to parse directly first
      parsedData = JSON.parse(content);
    } catch (e) {
      // Fallback: try to find JSON in the text if the model chatted around it
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Could not parse LLM response:', content);
        throw new Error('Invalid JSON response from LLM');
      }
    }

    return NextResponse.json({ segments: parsedData.segments });

  } catch (error: any) {
    console.error('Orchestration error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error?.message || 'Failed to orchestrate lyrics' },
      { status: error.response?.status || 500 }
    );
  }
}
