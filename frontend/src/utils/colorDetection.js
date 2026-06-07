// Webcam Color Detection and Classification Utility
// Converts pixel data to RGB/HSV and classifies it into Rubik's Cube facelet colors.

/**
 * Converts an RGB color to HSV.
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {object} { h: 0-360, s: 0-1, v: 0-1 }
 */
export function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: parseFloat(s.toFixed(2)),
    v: parseFloat(v.toFixed(2))
  };
}

/**
 * Classifies an RGB color into one of the 6 Rubik's Cube facelet codes: U, R, F, D, L, B.
 * Default color assignments:
 * - U: White
 * - R: Red
 * - F: Green
 * - D: Yellow
 * - L: Orange
 * - B: Blue
 * 
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} One of 'U', 'R', 'F', 'D', 'L', 'B'
 */
export function classifyColor(r, g, b) {
  const hsv = rgbToHsv(r, g, b);
  const { h, s, v } = hsv;

  // 1. White detection: low saturation and relatively high value
  if (s < 0.22 && v > 0.45) {
    return 'U'; // White (Up)
  }
  
  // Also handle muted grey/whites under low light
  if (v > 0.7 && s < 0.25) {
    return 'U';
  }

  // 2. Hue-based classification
  // Hue ranges (0-360):
  // Orange: 10 - 26
  // Yellow: 40 - 64
  // Green: 75 - 150
  // Blue: 180 - 245
  // Red: < 10 or > 340
  
  if (h >= 40 && h < 64) {
    return 'D'; // Yellow (Down)
  }
  
  if (h >= 75 && h < 155) {
    return 'F'; // Green (Front)
  }
  
  if (h >= 170 && h < 245) {
    return 'B'; // Blue (Back)
  }

  if (h >= 10 && h < 32) {
    // Distinguish between Orange and Red/Yellow
    if (s > 0.5) {
      return 'L'; // Orange (Left)
    } else {
      return 'R'; // Red (Right)
    }
  }

  // Red is at the boundary of Hue (0/360)
  if (h < 10 || h >= 320) {
    return 'R'; // Red (Right)
  }

  // Fallback distance-based classifier to nearest default colors if HSV is ambiguous
  const defaults = {
    U: { r: 240, g: 240, b: 240 }, // White
    R: { r: 220, g: 40,  b: 40  }, // Red
    F: { r: 40,  g: 190, b: 70  }, // Green
    D: { r: 230, g: 210, b: 30  }, // Yellow
    L: { r: 240, g: 120, b: 20  }, // Orange
    B: { r: 30,  g: 90,  b: 220 }  // Blue
  };

  let minDistance = Infinity;
  let bestMatch = 'U';

  for (const [code, rgb] of Object.entries(defaults)) {
    const dist = Math.sqrt(
      Math.pow(r - rgb.r, 2) +
      Math.pow(g - rgb.g, 2) +
      Math.pow(b - rgb.b, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = code;
    }
  }

  return bestMatch;
}

/**
 * Samples pixel data in a block on a canvas and classifies its color.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
 * @param {number} x - Center X coordinate of grid cell
 * @param {number} y - Center Y coordinate of grid cell
 * @param {number} size - Sample square box size (width & height)
 * @returns {string} Facelet code
 */
export function sampleGridCell(ctx, x, y, size) {
  const startX = Math.round(x - size / 2);
  const startY = Math.round(y - size / 2);
  
  try {
    const imgData = ctx.getImageData(startX, startY, size, size);
    const data = imgData.data;
    
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      sumR += data[i];
      sumG += data[i+1];
      sumB += data[i+2];
      count++;
    }

    const avgR = Math.round(sumR / count);
    const avgG = Math.round(sumG / count);
    const avgB = Math.round(sumB / count);

    return classifyColor(avgR, avgG, avgB);
  } catch (e) {
    console.error('Error sampling grid cell:', e);
    return 'U'; // Fallback to White
  }
}
