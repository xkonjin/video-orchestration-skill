import * as fs from 'fs/promises';
import * as path from 'path';
import {
  VideoConfig,
  Storyboard,
  Scene,
  GenerationMetadata,
  VideoStyle,
  AspectRatio,
  CameraMotion,
  Transition
} from './types';
import { NanoBananaProvider } from './providers/nano-banana';
import { VeoProvider } from './providers/veo';
import { FFmpegAssembler, createFallbackVideo } from './assembly/ffmpeg';

export class VideoOrchestrator {
  private config: VideoConfig;
  private nanoBanana: NanoBananaProvider;
  private veo: VeoProvider;
  private ffmpeg: FFmpegAssembler;
  private projectDir: string;

  constructor(config: VideoConfig) {
    this.config = config;
    this.nanoBanana = new NanoBananaProvider();
    this.veo = new VeoProvider();
    this.ffmpeg = new FFmpegAssembler();
    this.projectDir = '';
  }

  async initialize(): Promise<void> {
    const projectName = this.sanitizeProjectName(this.config.prompt);
    this.projectDir = path.join(this.config.output_dir, projectName);
    
    await fs.mkdir(path.join(this.projectDir, 'scenes'), { recursive: true });
    await fs.mkdir(path.join(this.projectDir, 'audio'), { recursive: true });
    
    console.log(`[Orchestrator] Project directory: ${this.projectDir}`);
  }

  private sanitizeProjectName(prompt: string): string {
    return prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  generateStoryboard(): Storyboard {
    const sceneDuration = 10;
    const sceneCount = this.config.scenes || Math.ceil(this.config.duration / sceneDuration);
    
    const scenes = this.generateScenes(sceneCount, sceneDuration);
    
    const storyboard: Storyboard = {
      title: this.config.prompt,
      duration_seconds: this.config.duration,
      style: this.config.style,
      aspect_ratio: this.config.aspect_ratio,
      scenes,
      audio: this.config.include_audio ? {
        music_style: this.getMusicStyle(this.config.style),
        ambient: 'subtle ambient sounds matching the scene'
      } : undefined,
      created_at: new Date().toISOString()
    };

    return storyboard;
  }

  private generateScenes(count: number, duration: number): Scene[] {
    const sceneTypes = [
      { name: 'opening_hook', motion: 'slow_zoom_in' as CameraMotion, desc: 'Opening shot to grab attention' },
      { name: 'introduction', motion: 'pan_right' as CameraMotion, desc: 'Establishing the scene and context' },
      { name: 'main_content_1', motion: 'dolly_forward' as CameraMotion, desc: 'First main element or feature' },
      { name: 'main_content_2', motion: 'orbit' as CameraMotion, desc: 'Second main element or feature' },
      { name: 'main_content_3', motion: 'pan_left' as CameraMotion, desc: 'Third main element or feature' },
      { name: 'detail_shot', motion: 'slow_zoom_in' as CameraMotion, desc: 'Close-up detail or highlight' },
      { name: 'atmosphere', motion: 'static' as CameraMotion, desc: 'Mood and atmosphere shot' },
      { name: 'closing', motion: 'slow_zoom_out' as CameraMotion, desc: 'Closing shot with call to action' }
    ];

    const scenes: Scene[] = [];
    const concept = this.config.prompt;

    for (let i = 0; i < count; i++) {
      const sceneType = sceneTypes[i % sceneTypes.length];
      
      scenes.push({
        id: i + 1,
        name: sceneType.name,
        duration,
        description: `${sceneType.desc} for "${concept}"`,
        camera_motion: sceneType.motion,
        mood: this.getMoodForStyle(this.config.style)
      });
    }

    return scenes;
  }

  private getMoodForStyle(style: VideoStyle): string {
    const moods: Record<VideoStyle, string> = {
      cinematic: 'dramatic, cinematic, evocative',
      commercial: 'bright, professional, inviting',
      artistic: 'contemplative, rich, expressive',
      social: 'energetic, vibrant, engaging'
    };
    return moods[style];
  }

  private getMusicStyle(style: VideoStyle): string {
    const music: Record<VideoStyle, string> = {
      cinematic: 'orchestral ambient',
      commercial: 'upbeat corporate',
      artistic: 'indie acoustic',
      social: 'trending pop beat'
    };
    return music[style];
  }

  async saveStoryboard(storyboard: Storyboard): Promise<string> {
    const storyboardPath = path.join(this.projectDir, 'storyboard.json');
    await fs.writeFile(storyboardPath, JSON.stringify(storyboard, null, 2));
    console.log(`[Orchestrator] Storyboard saved: ${storyboardPath}`);
    return storyboardPath;
  }

  async loadStoryboard(storyboardPath: string): Promise<Storyboard> {
    const content = await fs.readFile(storyboardPath, 'utf-8');
    return JSON.parse(content) as Storyboard;
  }

  async generateImages(storyboard: Storyboard): Promise<void> {
    console.log(`[Orchestrator] Generating ${storyboard.scenes.length} images...`);

    for (const scene of storyboard.scenes) {
      const imagePath = path.join(this.projectDir, 'scenes', `scene_${String(scene.id).padStart(2, '0')}.png`);
      
      try {
        await this.nanoBanana.generateSceneImage(
          scene.description,
          scene.mood,
          storyboard.style,
          storyboard.aspect_ratio,
          imagePath
        );
        scene.image_path = imagePath;
        console.log(`[Orchestrator] Scene ${scene.id} image generated`);
      } catch (error) {
        console.error(`[Orchestrator] Failed to generate image for scene ${scene.id}:`, error);
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async animateScenes(storyboard: Storyboard): Promise<void> {
    console.log(`[Orchestrator] Animating ${storyboard.scenes.length} scenes...`);

    for (const scene of storyboard.scenes) {
      if (!scene.image_path) {
        console.warn(`[Orchestrator] Scene ${scene.id} has no image, skipping animation`);
        continue;
      }

      const videoPath = path.join(this.projectDir, 'scenes', `scene_${String(scene.id).padStart(2, '0')}.mp4`);

      try {
        await this.veo.generateSceneVideo(
          scene.image_path,
          scene.camera_motion,
          scene.mood,
          scene.duration,
          videoPath
        );
        scene.video_path = videoPath;
        console.log(`[Orchestrator] Scene ${scene.id} animated with Veo`);
      } catch (error) {
        console.warn(`[Orchestrator] Veo failed for scene ${scene.id}, using Ken Burns fallback`);
        
        try {
          await createFallbackVideo(scene.image_path, videoPath, scene.duration);
          scene.video_path = videoPath;
        } catch (fallbackError) {
          console.error(`[Orchestrator] Fallback also failed for scene ${scene.id}:`, fallbackError);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async assembleVideo(storyboard: Storyboard): Promise<string> {
    const clips = storyboard.scenes
      .filter(s => s.video_path)
      .map(s => s.video_path as string);

    if (clips.length === 0) {
      throw new Error('No video clips to assemble');
    }

    const outputPath = path.join(this.projectDir, 'final.mp4');

    console.log(`[Orchestrator] Assembling ${clips.length} clips...`);

    const assembledPath = await this.ffmpeg.concatenateWithTransitions({
      clips,
      transition: this.config.transition,
      transition_duration: 0.5,
      output_path: outputPath
    });

    return assembledPath;
  }

  async generateMetadata(storyboard: Storyboard, finalPath: string): Promise<GenerationMetadata> {
    const metadata: GenerationMetadata = {
      project_name: this.sanitizeProjectName(this.config.prompt),
      created_at: new Date().toISOString(),
      config: this.config,
      storyboard,
      costs: {
        image_generation: this.nanoBanana.getEstimatedCost(storyboard.scenes.length),
        video_generation: this.veo.getEstimatedCost(this.config.duration),
        audio_generation: 0,
        total: 0
      },
      assets: {
        images: storyboard.scenes.filter(s => s.image_path).map(s => s.image_path as string),
        videos: storyboard.scenes.filter(s => s.video_path).map(s => s.video_path as string),
        audio: [],
        final: finalPath
      }
    };

    metadata.costs.total = metadata.costs.image_generation + metadata.costs.video_generation + metadata.costs.audio_generation;

    const metadataPath = path.join(this.projectDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return metadata;
  }

  async run(): Promise<GenerationMetadata> {
    console.log('[Orchestrator] Starting video generation pipeline...');
    console.log(`[Orchestrator] Prompt: "${this.config.prompt}"`);
    console.log(`[Orchestrator] Duration: ${this.config.duration}s, Style: ${this.config.style}`);

    await this.initialize();

    const storyboard = this.generateStoryboard();
    await this.saveStoryboard(storyboard);

    await this.generateImages(storyboard);

    await this.animateScenes(storyboard);

    const finalPath = await this.assembleVideo(storyboard);

    const metadata = await this.generateMetadata(storyboard, finalPath);

    console.log('[Orchestrator] Pipeline complete!');
    console.log(`[Orchestrator] Final video: ${finalPath}`);
    console.log(`[Orchestrator] Estimated cost: $${metadata.costs.total.toFixed(2)}`);

    return metadata;
  }
}

export async function createVideo(
  prompt: string,
  options: Partial<VideoConfig> = {}
): Promise<GenerationMetadata> {
  const config: VideoConfig = {
    prompt,
    duration: options.duration || 60,
    style: options.style || 'cinematic',
    aspect_ratio: options.aspect_ratio || '16:9',
    scenes: options.scenes,
    transition: options.transition || 'fade',
    include_audio: options.include_audio ?? true,
    output_dir: options.output_dir || './output'
  };

  const orchestrator = new VideoOrchestrator(config);
  return orchestrator.run();
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'create') {
    const prompt = args.slice(1).join(' ') || 'A cozy bookstore coffee shop';
    
    createVideo(prompt, {
      duration: 60,
      style: 'cinematic',
      output_dir: './output'
    })
      .then(metadata => {
        console.log('\n=== Generation Complete ===');
        console.log(`Final video: ${metadata.assets.final}`);
        console.log(`Total cost: $${metadata.costs.total.toFixed(2)}`);
      })
      .catch(console.error);
  } else {
    console.log(`
Video Orchestration Pipeline

Usage:
  npx ts-node src/orchestrator.ts create <prompt>

Examples:
  npx ts-node src/orchestrator.ts create "A cozy bookstore coffee shop"
  npx ts-node src/orchestrator.ts create "Luxury watch product showcase"

Environment variables required:
  FAL_KEY - fal.ai API key for Nano Banana Pro
  MINIMAX_API_KEY - MiniMax API key for Hailuo video generation
`);
  }
}
