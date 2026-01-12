#!/bin/bash
# FFmpeg Video Concatenation with Transitions
# Usage: ./ffmpeg-concat.sh <output_dir> <transition> <transition_duration>

set -e

OUTPUT_DIR="${1:-.}"
TRANSITION="${2:-fade}"
TRANSITION_DURATION="${3:-0.5}"

cd "$OUTPUT_DIR/scenes"

# Get list of video files
CLIPS=($(ls -1 scene_*.mp4 | sort))
NUM_CLIPS=${#CLIPS[@]}

if [ $NUM_CLIPS -eq 0 ]; then
    echo "Error: No scene_*.mp4 files found in $OUTPUT_DIR/scenes"
    exit 1
fi

echo "Found $NUM_CLIPS clips to concatenate"
echo "Using transition: $TRANSITION (${TRANSITION_DURATION}s)"

if [ $NUM_CLIPS -eq 1 ]; then
    cp "${CLIPS[0]}" "$OUTPUT_DIR/final.mp4"
    echo "Single clip - copied to final.mp4"
    exit 0
fi

# Build ffmpeg command
INPUTS=""
FILTER=""
OFFSET=0

for i in "${!CLIPS[@]}"; do
    INPUTS="$INPUTS -i ${CLIPS[$i]}"
    
    if [ $i -gt 0 ]; then
        # Get duration of previous clip
        PREV_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${CLIPS[$((i-1))]}")
        PREV_DURATION=${PREV_DURATION%.*}  # Remove decimal
        
        OFFSET=$((OFFSET + PREV_DURATION - 1))
        
        if [ $i -eq 1 ]; then
            FILTER="[0:v][1:v]xfade=transition=$TRANSITION:duration=$TRANSITION_DURATION:offset=$OFFSET[v1]"
        else
            PREV=$((i-1))
            FILTER="$FILTER;[v$PREV][$i:v]xfade=transition=$TRANSITION:duration=$TRANSITION_DURATION:offset=$OFFSET[v$i]"
        fi
    fi
done

LAST_LABEL="v$((NUM_CLIPS-1))"

echo "Running ffmpeg..."
ffmpeg -y $INPUTS -filter_complex "$FILTER" -map "[$LAST_LABEL]" \
    -c:v libx264 -crf 18 -preset medium \
    "$OUTPUT_DIR/final.mp4"

echo "Output: $OUTPUT_DIR/final.mp4"

# Add audio if present
if [ -f "$OUTPUT_DIR/audio/music.mp3" ]; then
    echo "Adding background music..."
    ffmpeg -y -i "$OUTPUT_DIR/final.mp4" -i "$OUTPUT_DIR/audio/music.mp3" \
        -filter_complex "[1:a]volume=0.3[a]" \
        -map 0:v -map "[a]" -shortest \
        "$OUTPUT_DIR/final_with_audio.mp4"
    mv "$OUTPUT_DIR/final_with_audio.mp4" "$OUTPUT_DIR/final.mp4"
fi

echo "Done!"
