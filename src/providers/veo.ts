import { CameraMotion } from '../types';
import * as fs from 'fs/promises';

// Google Veo API via Vertex AI
const VEO_MODELS = {
  veo31: 'veo-3.1-generate-001',
  veo31Fast: 'veo-3.1-fast-generate-001',
  veo3: 'veo-3.0-generate-001',
  veo2: 'veo-2.0-generate-001'
};

const CAMERA_MOTION_PROMPTS: Record<CameraMotion, string> = {
  static: 'Camera holds perfectly still, subtle ambient motion in the scene',
  slow_zoom_in: 'Camera slowly pushes forward, gradual zoom into the scene',
  slow_zoom_out: 'Camera slowly pulls back, revealing more of the environment',
  pan_left: 'Camera smoothly pans to the left, revealing the scene',
  pan_right: 'Camera smoothly pans to the right, revealing the scene',
  tilt_up: 'Camera tilts upward, revealing vertical elements',
  tilt_down: 'Camera tilts downward, following the subject',
  dolly_forward: 'Camera moves forward through the space, immersive movement',
  dolly_backward: 'Camera moves backward, expanding the view',
  orbit: 'Camera slowly orbits around the subject'
};

interface VeoResponse {
  name: string;
  done: boolean;
  response?: {
    generatedSamples: Array<{
      video: {
        uri: string;
      };
    }>;
  };
  error?: {
    message: string;
  };
}

export class VeoProvider {
  private apiKey: string;
  private projectId: string;
  private location: string;
  private model: string;

  constructor(apiKey?: string, projectId?: string, location?: string, model?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
    this.projectId = projectId || process.env.GOOGLE_CLOUD_PROJECT || '';
    this.location = location || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
    this.model = model || VEO_MODELS.veo31;
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required for Veo');
    }
    if (!this.projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required for Veo');
    }
  }

  private getBaseUrl(): string {
    return `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}`;
  }

  async imageToBase64(imagePath: string): Promise<string> {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  }

  async generateVideoFromImage(
    imagePath: string,
    motionPrompt: string,
    duration: number = 8,
    aspectRatio: '16:9' | '9:16' = '16:9'
  ): Promise<string> {
    const imageBase64 = await this.imageToBase64(imagePath);
    
    // Veo supports 4, 6, or 8 second videos
    const videoDuration = Math.min(Math.max(duration, 4), 8);
    
    console.log(`[Veo] Submitting image-to-video task...`);

    const url = `${this.getBaseUrl()}:predictLongRunning`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{
          prompt: motionPrompt,
          image: {
            bytesBase64Encoded: imageBase64
          }
        }],
        parameters: {
          aspectRatio: aspectRatio,
          sampleCount: 1,
          durationSeconds: videoDuration,
          personGeneration: 'allow_adult'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Veo API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const operationName = result.name;
    
    if (!operationName) {
      throw new Error('No operation name returned from Veo API');
    }

    console.log(`[Veo] Operation started: ${operationName}`);
    return operationName;
  }

  async generateVideoFromText(
    prompt: string,
    duration: number = 8,
    aspectRatio: '16:9' | '9:16' = '16:9'
  ): Promise<string> {
    const videoDuration = Math.min(Math.max(duration, 4), 8);
    
    console.log(`[Veo] Submitting text-to-video task...`);

    const url = `${this.getBaseUrl()}:predictLongRunning`;
    
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
          aspectRatio: aspectRatio,
          sampleCount: 1,
          durationSeconds: videoDuration,
          personGeneration: 'allow_adult'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Veo API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const operationName = result.name;
    
    if (!operationName) {
      throw new Error('No operation name returned from Veo API');
    }

    console.log(`[Veo] Operation started: ${operationName}`);
    return operationName;
  }

  async checkStatus(operationName: string): Promise<VeoResponse> {
    const url = `https://${this.location}-aiplatform.googleapis.com/v1/${operationName}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Veo status check error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<VeoResponse>;
  }

  async waitForCompletion(operationName: string, maxWaitMs: number = 600000): Promise<string> {
    const startTime = Date.now();
    const pollInterval = 10000; // Veo takes longer, poll every 10s

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.checkStatus(operationName);
      
      console.log(`[Veo] Operation status: ${status.done ? 'completed' : 'processing'}`);
      
      if (status.done) {
        if (status.error) {
          throw new Error(`Video generation failed: ${status.error.message}`);
        }
        
        if (status.response?.generatedSamples?.[0]?.video?.uri) {
          return status.response.generatedSamples[0].video.uri;
        }
        
        throw new Error('No video URI in completed response');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Video generation timed out after ${maxWaitMs}ms`);
  }

  async downloadVideo(gcsUri: string, outputPath: string): Promise<string> {
    // Convert gs:// URI to https URL for download
    // Format: gs://bucket/path -> https://storage.googleapis.com/bucket/path
    const httpsUrl = gcsUri.replace('gs://', 'https://storage.googleapis.com/');
    
    console.log(`[Veo] Downloading from: ${httpsUrl}`);
    
    const response = await fetch(httpsUrl, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(buffer));
    
    console.log(`[Veo] Video saved to: ${outputPath}`);
    return outputPath;
  }

  async generateSceneVideo(
    imagePath: string,
    cameraMotion: CameraMotion,
    sceneMood: string,
    duration: number,
    outputPath: string
  ): Promise<string> {
    const motionPrompt = `${CAMERA_MOTION_PROMPTS[cameraMotion]}, ${sceneMood} atmosphere, smooth natural cinematic movement, high quality`;
    
    const operationName = await this.generateVideoFromImage(imagePath, motionPrompt, duration);
    const videoUri = await this.waitForCompletion(operationName);
    await this.downloadVideo(videoUri, outputPath);
    
    return outputPath;
  }

  getEstimatedCost(totalSeconds: number): number {
    // Veo pricing varies, estimate ~$0.05 per second
    return totalSeconds * 0.05;
  }
}

export function getMotionPrompt(cameraMotion: CameraMotion, mood: string): string {
  return `${CAMERA_MOTION_PROMPTS[cameraMotion]}, ${mood} atmosphere, smooth natural movement`;
}

export async function generateVideo(
  imagePath: string,
  cameraMotion: CameraMotion,
  mood: string,
  duration: number,
  outputPath: string
): Promise<string> {
  const provider = new VeoProvider();
  return provider.generateSceneVideo(imagePath, cameraMotion, mood, duration, outputPath);
}
