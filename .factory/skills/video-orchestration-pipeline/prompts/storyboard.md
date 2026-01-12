# Storyboard Generation Prompts

## Scene Planning System Prompt

You are a professional video storyboard artist. Given a concept, break it down into cinematic scenes that will be generated as images and animated into video clips.

## Scene Breakdown Template

For each scene, provide:
1. **Scene Name**: Short identifier (e.g., "exterior_establishing")
2. **Duration**: How long in seconds (typically 8-12s)
3. **Description**: Detailed visual description for image generation
4. **Camera Motion**: How the camera should move
5. **Mood**: Emotional atmosphere

## Camera Motion Options

- `static` - Camera holds still, ambient motion only
- `slow_zoom_in` - Gradual push toward subject
- `slow_zoom_out` - Gradual pull back to reveal
- `pan_left` / `pan_right` - Horizontal sweep
- `tilt_up` / `tilt_down` - Vertical sweep
- `dolly_forward` / `dolly_backward` - Move through space
- `orbit` - Circle around subject

## Scene Type Templates

### Opening/Hook Scene
```json
{
  "name": "opening_hook",
  "description": "Eye-catching establishing shot that immediately captures attention. [Subject] in [setting] with [dramatic element].",
  "camera_motion": "slow_zoom_in",
  "mood": "intriguing, inviting"
}
```

### Introduction Scene
```json
{
  "name": "introduction",
  "description": "Wide shot establishing the overall context. Shows [main subject/location] in its environment.",
  "camera_motion": "pan_right",
  "mood": "welcoming, establishing"
}
```

### Feature/Detail Scene
```json
{
  "name": "feature_detail",
  "description": "Close-up focusing on [specific element]. Shows texture, quality, or important detail.",
  "camera_motion": "slow_zoom_in",
  "mood": "focused, appreciative"
}
```

### Action/Movement Scene
```json
{
  "name": "action_moment",
  "description": "Dynamic shot showing [action or movement]. Energy and life in the scene.",
  "camera_motion": "dolly_forward",
  "mood": "energetic, dynamic"
}
```

### Atmosphere Scene
```json
{
  "name": "atmosphere",
  "description": "Mood shot capturing the feeling and ambiance. [Lighting], [environmental details], [sensory elements].",
  "camera_motion": "static",
  "mood": "contemplative, immersive"
}
```

### Closing Scene
```json
{
  "name": "closing",
  "description": "Final memorable shot. [Logo/brand element] or [call to action visual]. Leaves lasting impression.",
  "camera_motion": "slow_zoom_out",
  "mood": "memorable, conclusive"
}
```

## Example: Bookstore Coffee Shop (60s video)

**Concept**: "Create a promotional video for Books & Brews, a cozy bookstore that doubles as a coffee shop"

**Storyboard**:

```json
{
  "title": "Books & Brews - Where Stories Meet Coffee",
  "duration_seconds": 60,
  "scenes": [
    {
      "id": 1,
      "name": "exterior_evening",
      "duration": 10,
      "description": "Charming brick storefront with large windows glowing warmly, vintage wooden 'Books & Brews' sign with decorative coffee cup and book icons, autumn leaves on sidewalk, inviting atmosphere",
      "camera_motion": "slow_zoom_in",
      "mood": "warm, inviting, magical"
    },
    {
      "id": 2,
      "name": "entrance_welcome",
      "duration": 10,
      "description": "Cozy entrance with exposed brick walls, chalkboard menu, potted plants, comfortable seating visible beyond, soft warm lighting from Edison bulbs",
      "camera_motion": "dolly_forward",
      "mood": "welcoming, cozy"
    },
    {
      "id": 3,
      "name": "bookshelf_exploration",
      "duration": 10,
      "description": "Floor-to-ceiling wooden bookshelves filled with colorful books, rolling ladder, cozy reading nooks, warm afternoon light streaming through windows",
      "camera_motion": "pan_right",
      "mood": "wonder, discovery"
    },
    {
      "id": 4,
      "name": "coffee_bar",
      "duration": 10,
      "description": "Artisan coffee bar with gleaming espresso machine, displayed pastries, barista carefully crafting latte art, steam rising, warm ambient lighting",
      "camera_motion": "orbit",
      "mood": "artisanal, craft"
    },
    {
      "id": 5,
      "name": "reading_nook",
      "duration": 10,
      "description": "Cozy reading corner with plush armchair, warm blanket, steaming cup of coffee on side table, book open, soft lamp light, rain visible through nearby window",
      "camera_motion": "slow_zoom_in",
      "mood": "peaceful, content"
    },
    {
      "id": 6,
      "name": "closing_brand",
      "duration": 10,
      "description": "Artistic shot of coffee cup with latte art next to open book, 'Books & Brews' logo subtly visible, warm golden hour lighting, cozy blur in background",
      "camera_motion": "slow_zoom_out",
      "mood": "memorable, aspirational"
    }
  ],
  "audio": {
    "music_style": "soft acoustic guitar with gentle piano",
    "ambient": "quiet cafe sounds, turning pages, gentle rain"
  }
}
```

## Tips for Great Storyboards

1. **Start strong** - The first 3 seconds must hook viewers
2. **Vary shot types** - Mix wide, medium, and close-up shots
3. **Create flow** - Each scene should logically lead to the next
4. **Consider rhythm** - Alternate between dynamic and calm scenes
5. **End memorably** - The closing shot should leave an impression
6. **Match brand** - Ensure visuals align with the intended message
