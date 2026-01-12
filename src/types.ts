export interface Scene {
  id: number;
  name: string;
  duration: number;
  description: string;
  camera_motion: CameraMotion;
  mood: string;
  image_path?: string;
  video_path?: string;
}

export type CameraMotion = 
  | 'static'
  | 'slow_zoom_in'
  | 'slow_zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'tilt_up'
  | 'tilt_down'
  | 'dolly_forward'
  | 'dolly_backward'
  | 'orbit';

export interface AudioConfig {
  music_style?: string;
  music_path?: string;
  ambient?: string;
  ambient_path?: string;
  voiceover?: string;
  voiceover_path?: string;
}

export interface Storyboard {
  title: string;
  duration_seconds: number;
  style: VideoStyle;
  aspect_ratio: AspectRatio;
  scenes: Scene[];
  audio?: AudioConfig;
  created_at: string;
}

export type VideoStyle = 'cinematic' | 'commercial' | 'artistic' | 'social';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';
export type Transition = 'fade' | 'wipeleft' | 'wiperight' | 'slideup' | 'slidedown' | 'dissolve' | 'circleopen';

export interface VideoConfig {
  prompt: string;
  duration: number;
  style: VideoStyle;
  aspect_ratio: AspectRatio;
  scenes?: number;
  transition: Transition;
  include_audio: boolean;
  output_dir: string;
}

export interface NanoBananaRequest {
  prompt: string;
  image_size: string;
  num_images?: number;
  seed?: number;
}

export interface NanoBananaResponse {
  images: Array<{
    url: string;
    content_type: string;
  }>;
  seed: number;
}

export interface HailuoRequest {
  model: string;
  prompt: string;
  first_frame_image?: string;
  duration?: number;
}

export interface HailuoResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: string;
}

export interface GlifWorkflow {
  id: string;
  name: string;
  inputs: Record<string, unknown>;
}

export interface AssemblyConfig {
  clips: string[];
  transition: Transition;
  transition_duration: number;
  output_path: string;
  audio?: {
    music_path?: string;
    music_volume?: number;
    ambient_path?: string;
    ambient_volume?: number;
  };
}

export interface GenerationMetadata {
  project_name: string;
  created_at: string;
  config: VideoConfig;
  storyboard: Storyboard;
  costs: {
    image_generation: number;
    video_generation: number;
    audio_generation: number;
    total: number;
  };
  assets: {
    images: string[];
    videos: string[];
    audio: string[];
    final: string;
  };
}
