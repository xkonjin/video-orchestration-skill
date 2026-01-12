import { HailuoRequest, HailuoResponse, CameraMotion } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

const MINIMAX_API_URL = 'https://api.minimax.chat/v1/video_generation';
const MINIMAX_STATUS_URL = 'https://api.minimax.chat/v1/query/video_generation';

const CAMERA_MOTION_PROMPTS: Record<CameraMotion, string> = {
  static: 'Camera holds steady, subtle ambient motion in the scene',
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

export class HailuoProvider {
  private apiKey: string;
  private groupId: string;

  constructor(apiKey?: string, groupId?: string) {
    this.apiKey = apiKey || process.env.MINIMAX_API_KEY || process.env.HAILUO_API_KEY || '';
    this.groupId = groupId || process.env.MINIMAX_GROUP_ID || '';
    
    if (!this.apiKey) {
      throw new Error('MINIMAX_API_KEY or HAILUO_API_KEY environment variable is required');
    }
  }

  async imageToBase64(imagePath: string): Promise<string> {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  }

  async generateVideo(
    imagePath: string,
    motionPrompt: string,
    duration: number = 10
  ): Promise<string> {
    const imageBase64 = await this.imageToBase64(imagePath);
    
    const request: HailuoRequest = {
      model: 'video-01',
      prompt: motionPrompt,
      first_frame_image: `data:image/png;base64,${imageBase64}`,
      duration: Math.min(duration, 10)
    };

    console.log(`[Hailuo] Submitting video generation task...`);

    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hailuo API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const taskId = result.task_id;
    
    if (!taskId) {
      throw new Error('No task_id returned from Hailuo API');
    }

    console.log(`[Hailuo] Task submitted: ${taskId}`);
    return taskId;
  }

  async checkStatus(taskId: string): Promise<HailuoResponse> {
    const response = await fetch(`${MINIMAX_STATUS_URL}?task_id=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hailuo status check error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<HailuoResponse>;
  }

  async waitForCompletion(taskId: string, maxWaitMs: number = 600000): Promise<string> {
    const startTime = Date.now();
    const pollInterval = 5000;

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.checkStatus(taskId);
      
      console.log(`[Hailuo] Task ${taskId} status: ${status.status}`);
      
      if (status.status === 'completed' && status.video_url) {
        return status.video_url;
      }
      
      if (status.status === 'failed') {
        throw new Error(`Video generation failed: ${status.error || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Video generation timed out after ${maxWaitMs}ms`);
  }

  async downloadVideo(url: string, outputPath: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(buffer));
    
    console.log(`[Hailuo] Video saved to: ${outputPath}`);
    return outputPath;
  }

  async generateSceneVideo(
    imagePath: string,
    cameraMotion: CameraMotion,
    sceneMood: string,
    duration: number,
    outputPath: string
  ): Promise<string> {
    const motionPrompt = `${CAMERA_MOTION_PROMPTS[cameraMotion]}, ${sceneMood} atmosphere, smooth natural movement`;
    
    const taskId = await this.generateVideo(imagePath, motionPrompt, duration);
    const videoUrl = await this.waitForCompletion(taskId);
    await this.downloadVideo(videoUrl, outputPath);
    
    return outputPath;
  }

  getEstimatedCost(totalSeconds: number): number {
    return totalSeconds * 0.08;
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
  const provider = new HailuoProvider();
  return provider.generateSceneVideo(imagePath, cameraMotion, mood, duration, outputPath);
}
