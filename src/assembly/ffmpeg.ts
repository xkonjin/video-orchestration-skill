import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AssemblyConfig, Transition } from '../types';

const execAsync = promisify(exec);

const TRANSITION_FILTERS: Record<Transition, string> = {
  fade: 'fade',
  wipeleft: 'wipeleft',
  wiperight: 'wiperight',
  slideup: 'slideup',
  slidedown: 'slidedown',
  dissolve: 'dissolve',
  circleopen: 'circleopen'
};

export class FFmpegAssembler {
  
  async checkFFmpeg(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch {
      return false;
    }
  }

  async getVideoDuration(videoPath: string): Promise<number> {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );
    return parseFloat(stdout.trim());
  }

  async concatenateWithTransitions(config: AssemblyConfig): Promise<string> {
    const { clips, transition, transition_duration, output_path } = config;
    
    if (clips.length === 0) {
      throw new Error('No clips provided for assembly');
    }

    if (clips.length === 1) {
      await fs.copyFile(clips[0], output_path);
      return output_path;
    }

    console.log(`[FFmpeg] Assembling ${clips.length} clips with ${transition} transitions`);

    const durations: number[] = [];
    for (const clip of clips) {
      durations.push(await this.getVideoDuration(clip));
    }

    let filterComplex = '';
    let currentOffset = 0;
    const transitionFilter = TRANSITION_FILTERS[transition];

    for (let i = 0; i < clips.length - 1; i++) {
      const clipDuration = durations[i];
      const offset = currentOffset + clipDuration - transition_duration;
      
      if (i === 0) {
        filterComplex += `[0:v][1:v]xfade=transition=${transitionFilter}:duration=${transition_duration}:offset=${offset}[v${i}]`;
      } else {
        filterComplex += `;[v${i-1}][${i+1}:v]xfade=transition=${transitionFilter}:duration=${transition_duration}:offset=${offset}[v${i}]`;
      }
      
      currentOffset = offset;
    }

    const inputs = clips.map(c => `-i "${c}"`).join(' ');
    const outputLabel = `[v${clips.length - 2}]`;
    
    const command = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "${outputLabel}" -c:v libx264 -crf 18 -preset medium "${output_path}"`;
    
    console.log(`[FFmpeg] Running: ${command.substring(0, 200)}...`);
    
    try {
      await execAsync(command);
      console.log(`[FFmpeg] Video assembled: ${output_path}`);
      return output_path;
    } catch (error) {
      console.error('[FFmpeg] Assembly failed, trying simple concat...');
      return this.simpleConcatenate(clips, output_path);
    }
  }

  async simpleConcatenate(clips: string[], outputPath: string): Promise<string> {
    const listPath = outputPath.replace('.mp4', '_list.txt');
    const listContent = clips.map(c => `file '${c}'`).join('\n');
    
    await fs.writeFile(listPath, listContent);
    
    const command = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    await execAsync(command);
    
    await fs.unlink(listPath);
    
    console.log(`[FFmpeg] Video concatenated (simple): ${outputPath}`);
    return outputPath;
  }

  async addAudio(
    videoPath: string,
    outputPath: string,
    musicPath?: string,
    musicVolume: number = 0.3,
    ambientPath?: string,
    ambientVolume: number = 0.1
  ): Promise<string> {
    if (!musicPath && !ambientPath) {
      await fs.copyFile(videoPath, outputPath);
      return outputPath;
    }

    let command = `ffmpeg -y -i "${videoPath}"`;
    let filterComplex = '';
    let audioInputs = 1;

    if (musicPath) {
      command += ` -i "${musicPath}"`;
      filterComplex += `[${audioInputs}:a]volume=${musicVolume}[music]`;
      audioInputs++;
    }

    if (ambientPath) {
      command += ` -i "${ambientPath}"`;
      const ambientIndex = musicPath ? audioInputs : 1;
      if (filterComplex) filterComplex += ';';
      filterComplex += `[${ambientIndex}:a]volume=${ambientVolume}[ambient]`;
      audioInputs++;
    }

    if (musicPath && ambientPath) {
      filterComplex += ';[music][ambient]amix=inputs=2[a]';
      command += ` -filter_complex "${filterComplex}" -map 0:v -map "[a]" -shortest "${outputPath}"`;
    } else if (musicPath) {
      command += ` -filter_complex "${filterComplex}" -map 0:v -map "[music]" -shortest "${outputPath}"`;
    } else if (ambientPath) {
      command += ` -filter_complex "${filterComplex}" -map 0:v -map "[ambient]" -shortest "${outputPath}"`;
    }

    console.log(`[FFmpeg] Adding audio to video...`);
    await execAsync(command);
    console.log(`[FFmpeg] Audio added: ${outputPath}`);
    
    return outputPath;
  }

  async createKenBurnsVideo(
    imagePath: string,
    outputPath: string,
    duration: number = 10,
    effect: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' = 'zoom_in'
  ): Promise<string> {
    let filter: string;
    
    switch (effect) {
      case 'zoom_in':
        filter = `zoompan=z='min(zoom+0.001,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * 25}:s=1920x1080:fps=25`;
        break;
      case 'zoom_out':
        filter = `zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.001))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * 25}:s=1920x1080:fps=25`;
        break;
      case 'pan_left':
        filter = `zoompan=z='1.2':x='if(lte(on,1),0,x+1)':y='ih/2-(ih/zoom/2)':d=${duration * 25}:s=1920x1080:fps=25`;
        break;
      case 'pan_right':
        filter = `zoompan=z='1.2':x='if(lte(on,1),iw,x-1)':y='ih/2-(ih/zoom/2)':d=${duration * 25}:s=1920x1080:fps=25`;
        break;
    }

    const command = `ffmpeg -y -loop 1 -i "${imagePath}" -vf "${filter}" -c:v libx264 -t ${duration} -pix_fmt yuv420p "${outputPath}"`;
    
    console.log(`[FFmpeg] Creating Ken Burns video (${effect})...`);
    await execAsync(command);
    console.log(`[FFmpeg] Ken Burns video created: ${outputPath}`);
    
    return outputPath;
  }

  async addTextOverlay(
    videoPath: string,
    outputPath: string,
    text: string,
    position: 'top' | 'center' | 'bottom' = 'bottom',
    fontSize: number = 48
  ): Promise<string> {
    const yPosition = position === 'top' ? '50' : position === 'center' ? '(h-text_h)/2' : 'h-th-50';
    
    const filter = `drawtext=text='${text.replace(/'/g, "\\'")}':fontsize=${fontSize}:fontcolor=white:x=(w-text_w)/2:y=${yPosition}:shadowcolor=black:shadowx=2:shadowy=2`;
    
    const command = `ffmpeg -y -i "${videoPath}" -vf "${filter}" -c:a copy "${outputPath}"`;
    
    await execAsync(command);
    console.log(`[FFmpeg] Text overlay added: ${outputPath}`);
    
    return outputPath;
  }

  async generateClipList(clips: string[], outputPath: string): Promise<string> {
    const content = clips.map(c => `file '${path.resolve(c)}'`).join('\n');
    await fs.writeFile(outputPath, content);
    return outputPath;
  }
}

export async function assembleVideo(config: AssemblyConfig): Promise<string> {
  const assembler = new FFmpegAssembler();
  
  const hasFFmpeg = await assembler.checkFFmpeg();
  if (!hasFFmpeg) {
    throw new Error('ffmpeg is not installed or not in PATH');
  }

  let outputPath = await assembler.concatenateWithTransitions(config);
  
  if (config.audio?.music_path || config.audio?.ambient_path) {
    const audioOutputPath = config.output_path.replace('.mp4', '_with_audio.mp4');
    outputPath = await assembler.addAudio(
      outputPath,
      audioOutputPath,
      config.audio.music_path,
      config.audio.music_volume || 0.3,
      config.audio.ambient_path,
      config.audio.ambient_volume || 0.1
    );
  }

  return outputPath;
}

export async function createFallbackVideo(
  imagePath: string,
  outputPath: string,
  duration: number
): Promise<string> {
  const assembler = new FFmpegAssembler();
  return assembler.createKenBurnsVideo(imagePath, outputPath, duration, 'zoom_in');
}
