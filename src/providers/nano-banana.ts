import { VideoStyle, AspectRatio } from '../types';
import * as fs from 'fs/promises';

// Google Gemini API for Nano Banana (Gemini 2.5 Flash Image / Gemini 3 Pro Image)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model options - Nano Banana is Gemini's image generation capability
const MODELS = {
  nanoBanana: 'gemini-2.0-flash-exp', // Gemini 2.5 Flash Image (Nano Banana)
  gemini3Pro: 'gemini-3-pro-image',   // Gemini 3 Pro Image
  imagen4: 'imagen-4.0-generate-001', // Imagen 4 via Vertex AI
  imagen4Ultra: 'imagen-4.0-ultra-generate-001'
};

const STYLE_SUFFIXES: Record<VideoStyle, string> = {
  cinematic: 'cinematic lighting, film grain, shallow depth of field, 35mm film, dramatic composition, professional photography',
  commercial: 'clean professional photography, bright and airy, high-end product showcase, studio lighting, commercial quality',
  artistic: 'painterly style, rich saturated colors, dramatic composition, fine art photography, artistic interpretation',
  social: 'vibrant colors, high contrast, eye-catching, trending aesthetic, punchy, social media ready'
};

const ASPECT_RATIO_MAP: Record<AspectRatio, string> = {
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1': '1:1',
  '4:5': '4:5'
};

interface GeminiImageResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        inlineData?: {
          mimeType: string;
          data: string;
        };
        text?: string;
      }>;
    };
  }>;
}

export class NanoBananaProvider {
  private apiKey: string;
  private model: string;
  private projectId?: string;

  constructor(apiKey?: string, model?: string, projectId?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
    this.model = model || MODELS.nanoBanana;
    this.projectId = projectId || process.env.GOOGLE_CLOUD_PROJECT;
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required for Nano Banana');
    }
  }

  async generateImage(
    description: string,
    style: VideoStyle,
    aspectRatio: AspectRatio = '16:9'
  ): Promise<{ imageData: string; mimeType: string }> {
    const styleSuffix = STYLE_SUFFIXES[style];
    const prompt = `Generate a high-quality image: ${description}, ${styleSuffix}`;
    
    console.log(`[NanoBanana] Generating image with Gemini: ${prompt.substring(0, 100)}...`);

    const url = `${GEMINI_API_URL}/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseModalities: ['image', 'text'],
          imageDimension: aspectRatio === '9:16' ? '768x1344' : 
                          aspectRatio === '1:1' ? '1024x1024' :
                          aspectRatio === '4:5' ? '896x1120' : '1344x768'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const result = await response.json() as GeminiImageResponse;
    
    // Extract image from response
    for (const candidate of result.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          console.log(`[NanoBanana] Image generated successfully`);
          return {
            imageData: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          };
        }
      }
    }

    throw new Error('No image returned from Gemini API');
  }

  async generateImageWithImagen(
    description: string,
    style: VideoStyle,
    aspectRatio: AspectRatio = '16:9'
  ): Promise<{ imageData: string; mimeType: string }> {
    // Imagen 4 via Vertex AI
    if (!this.projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT required for Imagen');
    }

    const styleSuffix = STYLE_SUFFIXES[style];
    const prompt = `${description}, ${styleSuffix}`;
    
    const url = `https://${process.env.GOOGLE_CLOUD_REGION || 'us-central1'}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${process.env.GOOGLE_CLOUD_REGION || 'us-central1'}/publishers/google/models/imagen-4.0-generate-001:predict`;
    
    console.log(`[Imagen4] Generating image: ${prompt.substring(0, 100)}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{
          prompt: prompt
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: ASPECT_RATIO_MAP[aspectRatio],
          outputOptions: {
            mimeType: 'image/png'
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Imagen API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    if (result.predictions?.[0]?.bytesBase64Encoded) {
      console.log(`[Imagen4] Image generated successfully`);
      return {
        imageData: result.predictions[0].bytesBase64Encoded,
        mimeType: 'image/png'
      };
    }

    throw new Error('No image returned from Imagen API');
  }

  async saveImage(imageData: string, mimeType: string, outputPath: string): Promise<string> {
    const buffer = Buffer.from(imageData, 'base64');
    await fs.writeFile(outputPath, buffer);
    console.log(`[NanoBanana] Image saved to: ${outputPath}`);
    return outputPath;
  }

  async generateSceneImage(
    sceneDescription: string,
    sceneMood: string,
    style: VideoStyle,
    aspectRatio: AspectRatio,
    outputPath: string
  ): Promise<string> {
    const fullDescription = `${sceneDescription}, ${sceneMood} atmosphere`;
    
    // Try Gemini Nano Banana first, fall back to Imagen if needed
    try {
      const result = await this.generateImage(fullDescription, style, aspectRatio);
      return this.saveImage(result.imageData, result.mimeType, outputPath);
    } catch (error) {
      console.warn(`[NanoBanana] Gemini failed, trying Imagen: ${error}`);
      const result = await this.generateImageWithImagen(fullDescription, style, aspectRatio);
      return this.saveImage(result.imageData, result.mimeType, outputPath);
    }
  }

  getEstimatedCost(imageCount: number): number {
    // Gemini 2.5 Flash Image: ~$0.039 per image
    // Imagen 4: $0.04 per image
    return imageCount * 0.04;
  }
}

export async function generateImage(
  description: string,
  style: VideoStyle,
  aspectRatio: AspectRatio,
  outputPath: string
): Promise<string> {
  const provider = new NanoBananaProvider();
  return provider.generateSceneImage(description, '', style, aspectRatio, outputPath);
}
