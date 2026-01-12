---
name: video-orchestration-pipeline
description: Orchestrate long-form video generation using AI image generation (Nano Banana Pro), video synthesis (Hailuo 2), and ffmpeg assembly from a single text prompt.
---

# Video Orchestration Pipeline

Generate complete long-form videos from text descriptions using Claude as an orchestration agent that coordinates multiple AI tools.

## When to Use

Invoke this skill when the user wants to:
- Create promotional or showcase videos from concepts
- Generate animated explainer videos
- Produce visual storytelling content
- Create product demos or walkthroughs
- Build social media video content (TikTok, Reels, Shorts)

## Pipeline Overview

```
[User Prompt] → [Storyboard] → [Images] → [Video Clips] → [Assembly] → [Final Video]
     ↓              ↓             ↓            ↓              ↓
   Claude      Claude AI    Nano Banana   Hailuo 2.3      ffmpeg
                            Pro (fal.ai)   (MiniMax)
```

## Pipeline Stages

### Stage 1: Storyboard Generation (Claude)
Break down the user's concept into discrete scenes with visual descriptions.

**Output Format:**
```json
{
  "title": "Bookstore Coffee Shop",
  "duration_seconds": 60,
  "scenes": [
    {
      "id": 1,
      "name": "exterior_establishing",
      "duration": 10,
      "description": "Cozy brick building with large windows, warm light spilling out, 'Books & Brews' sign",
      "camera_motion": "slow zoom in",
      "mood": "inviting, warm"
    }
  ],
  "audio": {
    "music_style": "soft acoustic",
    "ambient": "gentle cafe sounds"
  }
}
```

### Stage 2: Image Generation (Nano Banana Pro via fal.ai)

**API Endpoint:** `https://fal.run/fal-ai/nano-banana-pro`

**Features:**
- Native 4K resolution support
- Excellent text rendering for signage
- Character/subject consistency across frames
- Commercial-grade quality

**Request Format:**
```javascript
const result = await fal.run("fal-ai/nano-banana-pro", {
  input: {
    prompt: "{scene_description}, {style_suffix}",
    image_size: "landscape_16_9",
    num_images: 1
  }
});
```

**Style Suffixes by Video Type:**
- **Cinematic:** "cinematic lighting, film grain, shallow depth of field, 35mm film"
- **Commercial:** "clean professional photography, bright and airy, product showcase"
- **Artistic:** "painterly style, rich colors, dramatic composition"
- **Social Media:** "vibrant colors, high contrast, eye-catching, vertical format"

### Stage 3: Video Generation (Hailuo 2.3 via MiniMax)

**API Endpoint:** `https://api.minimax.chat/v1/video_generation`

**Capabilities:**
- Image-to-video with motion prompts
- 6-10 second clips at 1080p/30fps
- Camera movement control
- Physics-accurate motion

**Request Format:**
```javascript
const response = await fetch("https://api.minimax.chat/v1/video_generation", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${MINIMAX_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "video-01",
    prompt: "{motion_description}",
    first_frame_image: "{base64_or_url}",
    duration: 10
  })
});
```

**Motion Prompts by Camera Movement:**
- **Slow zoom:** "Camera slowly pushes forward, subtle movement"
- **Pan left/right:** "Camera smoothly pans to the {direction}, revealing more of the scene"
- **Dolly:** "Camera tracks alongside subject, maintaining framing"
- **Static with motion:** "Camera holds steady, {subject} moves naturally"

### Stage 4: Video Assembly (ffmpeg)

**Concatenation with Transitions:**
```bash
ffmpeg -i scene1.mp4 -i scene2.mp4 -i scene3.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=9.5[v01]; \
                   [v01][2:v]xfade=transition=fade:duration=0.5:offset=18.5[v]" \
  -map "[v]" output.mp4
```

**Available Transitions:**
- `fade` - Classic crossfade
- `wipeleft`, `wiperight` - Directional wipes
- `slideup`, `slidedown` - Slide transitions
- `circleopen`, `circleclose` - Circular reveals
- `dissolve` - Soft dissolve

**Adding Audio:**
```bash
ffmpeg -i video.mp4 -i music.mp3 -i ambient.mp3 \
  -filter_complex "[1:a]volume=0.3[music];[2:a]volume=0.1[ambient];[music][ambient]amix=inputs=2[a]" \
  -map 0:v -map "[a]" -shortest final.mp4
```

## Required Configuration

Environment variables:
```bash
export FAL_KEY="your_fal_ai_key"
export MINIMAX_API_KEY="your_minimax_key"
# Optional
export GLIF_API_KEY="your_glif_key"
export ELEVENLABS_API_KEY="your_elevenlabs_key"
```

## Execution Steps

1. **Parse user request** - Extract concept, duration, style preferences
2. **Generate storyboard** - Create scene breakdown with descriptions
3. **Generate images** - Call Nano Banana Pro for each scene
4. **Animate scenes** - Convert images to video via Hailuo 2.3
5. **Download clips** - Fetch completed video clips
6. **Assemble video** - Use ffmpeg to concatenate with transitions
7. **Add audio** - (Optional) Mix in music and ambient sounds
8. **Export final** - Output in requested format/resolution

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Video concept description |
| `duration` | number | 60 | Target duration in seconds |
| `style` | enum | "cinematic" | cinematic, commercial, artistic, social |
| `aspect_ratio` | enum | "16:9" | 16:9, 9:16, 1:1, 4:5 |
| `scenes` | number | auto | Number of scenes (auto-calculated from duration) |
| `transitions` | enum | "fade" | fade, wipe, slide, dissolve |
| `include_audio` | boolean | true | Generate/include background audio |
| `output_dir` | string | "./output" | Output directory |

## Output Artifacts

```
output/
├── {project_name}/
│   ├── storyboard.json      # Scene breakdown
│   ├── scenes/
│   │   ├── scene_01.png     # Generated images
│   │   ├── scene_01.mp4     # Animated clips
│   │   ├── scene_02.png
│   │   ├── scene_02.mp4
│   │   └── ...
│   ├── audio/
│   │   ├── music.mp3        # Background music
│   │   └── ambient.mp3      # Ambient sounds
│   ├── final.mp4            # Complete video
│   └── metadata.json        # Generation metadata
```

## Error Handling

- **Image generation fails**: Retry with simplified prompt, reduce detail
- **Video generation fails**: Fall back to Ken Burns effect (zoom/pan on static image)
- **API rate limits**: Implement exponential backoff, queue management
- **ffmpeg errors**: Log full error, provide manual assembly instructions
- **Timeout**: Save partial progress, allow resume

## Quality Verification

After completion, verify:
1. [ ] All scenes generated successfully
2. [ ] Visual consistency maintained across scenes
3. [ ] Transitions are smooth
4. [ ] Audio levels are balanced
5. [ ] Final video plays without artifacts
6. [ ] Duration matches target

## Example Usage

**User request:** "Create a 60-second promotional video for a cozy bookstore that doubles as a coffee shop called 'Books & Brews'"

**Execution:**
1. Generate storyboard with 6 scenes (10s each):
   - Exterior establishing shot
   - Entrance welcome
   - Browsing bookshelves
   - Coffee bar and barista
   - Cozy reading nook
   - Closing shot with logo

2. Generate images via Nano Banana Pro:
   - "Charming brick bookstore exterior, warm light from windows, vintage 'Books & Brews' sign, autumn evening, cinematic"
   
3. Animate via Hailuo 2.3:
   - "Camera slowly zooms toward entrance, leaves gently falling, warm inviting glow"

4. Assemble with fade transitions and soft acoustic music

**Output:** `./output/books-and-brews/final.mp4`

## Advanced: Glif Integration

For pre-built workflows, use Glif MCP:
```javascript
const result = await glif.run("video-generator-workflow", {
  prompt: "bookstore coffee shop",
  style: "cinematic",
  duration: 60
});
```

## Cost Estimation

| Component | Cost per Unit | Typical Usage |
|-----------|---------------|---------------|
| Nano Banana Pro | $0.15/image | 6-10 images |
| Hailuo 2.3 | ~$0.08/second | 60-90 seconds |
| Total | ~$6-10 | Per 60s video |
