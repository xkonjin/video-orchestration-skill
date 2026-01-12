# Video Orchestration Skill

AI-powered long-form video generation using Claude as an orchestration agent. Create complete videos from a single text prompt by combining:

- **Nano Banana Pro** (fal.ai) - High-quality image generation with text rendering
- **Hailuo 2.3** (MiniMax) - AI video generation from images
- **ffmpeg** - Video assembly, transitions, and audio mixing
- **Glif** (optional) - Pre-built visual workflow pipelines

## Quick Start

```bash
# Install dependencies
npm install

# Set up API keys
export FAL_KEY="your_fal_ai_key"
export MINIMAX_API_KEY="your_minimax_key"

# Generate a video
npm run create "A cozy bookstore that doubles as a coffee shop"
```

## How It Works

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐     ┌─────────┐
│  User Prompt    │ ──► │  Storyboard  │ ──► │   Images    │ ──► │  Clips   │ ──► │  Final  │
│                 │     │   (Claude)   │     │(Nano Banana)│     │ (Hailuo) │     │ (ffmpeg)│
└─────────────────┘     └──────────────┘     └─────────────┘     └──────────┘     └─────────┘
```

1. **Storyboard**: Claude breaks your concept into cinematic scenes
2. **Image Generation**: Nano Banana Pro creates high-quality images for each scene
3. **Video Animation**: Hailuo 2.3 animates images into video clips with camera motion
4. **Assembly**: ffmpeg stitches clips together with transitions and audio

## Installation

```bash
git clone https://github.com/yourusername/video-orchestration-skill.git
cd video-orchestration-skill
npm install
```

### Requirements

- Node.js 18+
- ffmpeg installed and in PATH
- API keys for fal.ai and MiniMax

### API Keys

Get your API keys:
- **fal.ai** (Nano Banana Pro): https://fal.ai/dashboard/keys
- **MiniMax** (Hailuo): https://platform.minimax.chat/

## Usage

### As a Droid Skill

This skill integrates with Factory's Droid CLI. Once installed, you can use:

```
@video-director Create a 60-second promotional video for a luxury spa retreat
```

### Programmatic Usage

```typescript
import { createVideo } from './src/orchestrator';

const metadata = await createVideo(
  "A cozy bookstore coffee shop called Books & Brews",
  {
    duration: 60,
    style: 'cinematic',
    aspect_ratio: '16:9',
    transition: 'fade'
  }
);

console.log(`Video created: ${metadata.assets.final}`);
console.log(`Total cost: $${metadata.costs.total.toFixed(2)}`);
```

### CLI Commands

```bash
# Full pipeline
npm run create "Your video concept here"

# Step by step
npm run storyboard -- --prompt "Your concept" --duration 60
npm run generate-images -- --storyboard ./output/project/storyboard.json
npm run animate -- --input ./output/project/scenes/
npm run assemble -- --input ./output/project/scenes/ --transition fade
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | number | 60 | Target video duration in seconds |
| `style` | string | "cinematic" | Visual style (cinematic, commercial, artistic, social) |
| `aspect_ratio` | string | "16:9" | Output aspect ratio (16:9, 9:16, 1:1, 4:5) |
| `scenes` | number | auto | Number of scenes (auto-calculated from duration) |
| `transition` | string | "fade" | Transition type between scenes |
| `include_audio` | boolean | true | Add background audio track |

## Video Styles

### Cinematic
- Film grain, dramatic lighting, shallow depth of field
- Best for: storytelling, emotional content, brand films

### Commercial
- Clean, bright, professional
- Best for: product showcases, corporate videos, ads

### Artistic
- Rich colors, painterly feel, expressive
- Best for: creative projects, art showcases, mood pieces

### Social
- Vibrant, high contrast, punchy
- Best for: TikTok, Reels, Shorts, social media content

## Output Structure

```
output/
└── your-project-name/
    ├── storyboard.json      # Scene breakdown
    ├── scenes/
    │   ├── scene_01.png     # Generated images
    │   ├── scene_01.mp4     # Animated clips
    │   ├── scene_02.png
    │   ├── scene_02.mp4
    │   └── ...
    ├── audio/               # Background audio (if enabled)
    ├── final.mp4            # Complete video
    └── metadata.json        # Generation details & costs
```

## Cost Estimation

| Component | Cost | Notes |
|-----------|------|-------|
| Nano Banana Pro | $0.15/image | ~6 images for 60s video |
| Hailuo 2.3 | ~$0.08/second | 60s = ~$4.80 |
| **Total** | **~$6-10** | Per 60-second video |

## Examples

### Bookstore Coffee Shop
```bash
npm run create "A cozy bookstore that doubles as a coffee shop called Books & Brews, \
featuring warm lighting, comfortable reading nooks, artisan coffee, and floor-to-ceiling bookshelves"
```

### Product Showcase
```bash
npm run create "Luxury watch collection showcase with dramatic lighting, \
showing intricate details, Swiss movement, and aspirational lifestyle shots" \
-- --style commercial --duration 45
```

### Social Media Content
```bash
npm run create "Quick tour of a trendy brunch spot in Brooklyn" \
-- --style social --aspect_ratio 9:16 --duration 30
```

## Troubleshooting

### ffmpeg not found
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
choco install ffmpeg
```

### API rate limits
The orchestrator includes automatic retry with exponential backoff. For large batches, consider adding delays between generations.

### Video generation fails
If Hailuo generation fails, the system automatically falls back to Ken Burns effect (zoom/pan on static image).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Credits

- Inspired by [@venturetwins](https://x.com/venturetwins) video orchestration concept
- Built for [Factory](https://factory.ai) Droid CLI
- Powered by fal.ai, MiniMax, and ffmpeg
