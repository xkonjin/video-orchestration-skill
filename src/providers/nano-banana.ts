import { NanoBananaRequest, NanoBananaResponse, VideoStyle, AspectRatio } from '../types';

const FAL_API_URL = 'https://fal.run/fal-ai/nano-banana-pro';

const STYLE_SUFFIXES: Record<VideoStyle, string> = {
  cinematic: 'cinematic lighting, film grain, shallow depth of field, 35mm film, dramatic composition, professional photography',
  commercial: 'clean professional photography, bright and airy, high-end product showcase, studio lighting, commercial quality',
  artistic: 'painterly style, rich saturated colors, dramatic composition, fine art photography, artistic interpretation',
  social: 'vibrant colors, high contrast, eye-catching, trending aesthetic, punchy, social media ready'
};

const ASPECT_RATIO_MAP: Record<AspectRatio, string> = {
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_16_9',
  '1:1': 'square',
  '4:5': 'portrait_4_3'
};

export class NanoBananaProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FAL_KEY || '';
    if (!this.apiKey) {
      throw new Error('FAL_KEY environment variable is required for Nano Banana Pro');
    }
  }

  async generateImage(
    description: string,
    style: VideoStyle,
    aspectRatio: AspectRatio = '16:9',
    seed?: number
  ): Promise<NanoBananaResponse> {
    const styleSuffix = STYLE_SUFFIXES[style];
    const imageSize = ASPECT_RATIO_MAP[aspectRatio];
    
    const prompt = `${description}, ${styleSuffix}`;
    
    const request: NanoBananaRequest = {
      prompt,
      image_size: imageSize,
      num_images: 1,
      ...(seed && { seed })
    };

    console.log(`[NanoBanana] Generating image with prompt: ${prompt.substring(0, 100)}...`);

    const response = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Nano Banana Pro API error: ${response.status} - ${error}`);
    }

    const result = await response.json() as NanoBananaResponse;
    console.log(`[NanoBanana] Image generated successfully`);
    
    return result;
  }

  async downloadImage(url: string, outputPath: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, Buffer.from(buffer));
    
    console.log(`[NanoBanana] Image saved to: ${outputPath}`);
    return outputPath;
  }

  async generateSceneImage(
    sceneDescription: string,
    sceneMood: string,
    style: VideoStyle,
    aspectRatio: AspectRatio,
    outputPath: string,
    seed?: number
  ): Promise<string> {
    const fullDescription = `${sceneDescription}, ${sceneMood} atmosphere`;
    
    const result = await this.generateImage(fullDescription, style, aspectRatio, seed);
    
    if (!result.images || result.images.length === 0) {
      throw new Error('No images returned from Nano Banana Pro');
    }

    await this.downloadImage(result.images[0].url, outputPath);
    return outputPath;
  }

  getEstimatedCost(imageCount: number): number {
    return imageCount * 0.15;
  }
}

export async function generateImage(
  description: string,
  style: VideoStyle,
  aspectRatio: AspectRatio,
  outputPath: string
): Promise<string> {
  const provider = new NanoBananaProvider();
  const result = await provider.generateImage(description, style, aspectRatio);
  
  if (!result.images || result.images.length === 0) {
    throw new Error('No images returned');
  }

  return provider.downloadImage(result.images[0].url, outputPath);
}
