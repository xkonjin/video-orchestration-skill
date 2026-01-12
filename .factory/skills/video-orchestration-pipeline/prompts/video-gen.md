# Video Generation Prompts for Hailuo 2.3

## Motion Prompt Structure

```
[Camera movement description], [Subject motion if any], [Atmospheric effects], [Mood continuation]
```

## Camera Motion Prompts

### Static (Ambient Motion Only)
```
Camera holds perfectly still, subtle ambient motion in the scene,
[specific ambient details], natural gentle movement
```

**Examples:**
- "Camera holds steady, steam rises gently from coffee cup, dust particles float in light beam"
- "Static shot, leaves rustle gently outside window, curtains sway slightly"

### Slow Zoom In
```
Camera slowly pushes forward toward [focal point], gradual zoom creating intimacy,
smooth continuous movement, [atmospheric elements]
```

**Examples:**
- "Camera slowly zooms toward the bookshelf, gradual intimate push, warm lighting consistent"
- "Slow push toward coffee cup, gentle zoom revealing latte art detail"

### Slow Zoom Out
```
Camera gradually pulls back revealing [broader context], smooth zoom out,
expanding view shows [environment details], [atmosphere maintained]
```

**Examples:**
- "Camera slowly pulls back revealing full reading nook, cozy atmosphere maintained"
- "Gradual zoom out from product to show surrounding context"

### Pan Left/Right
```
Camera smoothly pans [direction] across [scene element], continuous horizontal movement,
revealing [what comes into view], [lighting transition if any]
```

**Examples:**
- "Camera smoothly pans right across bookshelves, revealing titles and colors"
- "Slow pan left following steam rising from coffee"

### Tilt Up/Down
```
Camera tilts [direction] from [start point] to [end point], vertical sweep,
revealing [vertical elements], smooth continuous motion
```

**Examples:**
- "Camera tilts up from coffee cup to customer's satisfied expression"
- "Slow tilt down from sign to entrance door"

### Dolly Forward/Backward
```
Camera moves [direction] through space, immersive forward/backward motion,
passing [elements in scene], creating depth and presence
```

**Examples:**
- "Camera dollies forward through bookstore aisle, shelves passing on both sides"
- "Smooth backward dolly from counter, revealing full coffee bar setup"

### Orbit
```
Camera slowly circles around [subject], orbital motion at [speed],
maintaining focus on [focal point], revealing [different angles]
```

**Examples:**
- "Camera slowly orbits around coffee being prepared, 180-degree arc"
- "Gentle orbit around reading nook, showing space from multiple angles"

## Atmospheric Effects

Add these to enhance motion:

### Light Effects
- "Dust particles floating in light beams"
- "Warm light shifting subtly as camera moves"
- "Shadows playing across surfaces"
- "Bokeh lights twinkling in background"

### Environmental Motion
- "Steam rising and curling"
- "Pages of book fluttering slightly"
- "Rain streaking down window"
- "Leaves drifting past window"
- "Curtains swaying gently in breeze"

### Human Elements (if applicable)
- "Hands turning page naturally"
- "Coffee being lifted to lips"
- "Fingers tracing book spine"

## Scene-Specific Motion Prompts

### Exterior Establishing
```
Camera slowly pushes toward building entrance, evening atmosphere,
warm light glowing from windows, [seasonal elements] in gentle motion,
inviting and magical mood
```

### Interior Wide
```
Camera smoothly pans across interior space, revealing depth and details,
warm ambient lighting, subtle life and movement in scene,
cozy welcoming atmosphere
```

### Product/Detail
```
Camera gradually zooms toward [product], isolating beauty and detail,
[relevant atmospheric element], appreciative focused mood
```

### Closing Shot
```
Camera slowly pulls back from [focal element], expanding to show [context],
[memorable atmospheric touch], conclusive satisfying mood
```

## Duration Guidelines

- **6 seconds**: Quick impact shots, transitions
- **8 seconds**: Standard scene length, good for most content
- **10 seconds**: Maximum length, use for important establishing shots

## Quality Tips

1. **Keep prompts focused** - One clear camera movement per generation
2. **Match the mood** - Motion should complement, not contradict the image
3. **Add atmosphere** - Include subtle environmental motion
4. **Be specific** - "slowly" vs "quickly", "smoothly" vs "dynamically"
5. **Maintain consistency** - Keep lighting and atmosphere continuous

## Common Issues & Solutions

### Problem: Unnatural motion
**Solution**: Add "smooth", "natural", "gentle" modifiers

### Problem: Subject distortion
**Solution**: Use slower movements, simpler prompts

### Problem: Inconsistent lighting
**Solution**: Specify "consistent lighting throughout", "maintaining atmosphere"

### Problem: Too static
**Solution**: Add ambient motion elements (steam, particles, subtle movement)

## Fallback: Ken Burns Effect

If Hailuo generation fails, use ffmpeg Ken Burns as backup:
- `zoom_in` - Slow push into image
- `zoom_out` - Slow pull from image  
- `pan_left/right` - Horizontal drift across image

These are simpler but ensure coverage for all scenes.
