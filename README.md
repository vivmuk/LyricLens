# LyricLens

Transform song lyrics into cinematic 10-second video clips using AI.

## About

LyricLens is an automated content creation tool that takes song lyrics as input and produces a synchronized visual narrative using Venice.ai API.

## Features

- **Lyrics Segmentation**: Automatically breaks down lyrics into 10-second scenes using LLMs
- **Visual Generation**: Creates high-quality images for each scene
- **Video Generation**: Animates scenes into video clips
- **Multiple Styles**: Support for various visual styles (Cyberpunk, Watercolor, Photorealistic, etc.)

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS
- Venice.ai API

## Getting Started

```bash
npm install
npm run dev
```

## Deployment

This app is configured for Railway deployment. Make sure to set the `VENICE_API_KEY` environment variable.
