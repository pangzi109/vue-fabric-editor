// Conservative, local trimming for the five product image slots.
const MAX_ANALYSIS_SIDE = 1600;
const ALPHA_THRESHOLD = 8;
const BACKGROUND_DISTANCE = 24;
const EDGE_DISTANCE = 18;
const MIN_EDGE_AGREEMENT = 0.97;
const SAFETY_MARGIN = 0.04;
const MIN_REMOVED_AREA = 0.08;

type Bounds = { left: number; top: number; right: number; bottom: number };

const colorDistance = (pixels: Uint8ClampedArray, offset: number, color: number[]) =>
  Math.max(
    Math.abs(pixels[offset] - color[0]),
    Math.abs(pixels[offset + 1] - color[1]),
    Math.abs(pixels[offset + 2] - color[2])
  );

const median = (values: number[]) => {
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
};

const contentBounds = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  isContent: (index: number) => boolean
): Bounds | null => {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isContent(y * width + x)) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? null : { left, top, right: right + 1, bottom: bottom + 1 };
};

const opaqueContentBounds = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Bounds | null => {
  const samples: number[][] = [];
  const sides: number[][][] = [[], [], [], []];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 100));
  const sample = (x: number, y: number, side: number) => {
    const offset = (y * width + x) * 4;
    const rgb = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
    samples.push(rgb);
    sides[side].push(rgb);
  };
  for (let x = 0; x < width; x += step) {
    sample(x, 0, 0);
    sample(x, height - 1, 1);
  }
  for (let y = 0; y < height; y += step) {
    sample(0, y, 2);
    sample(width - 1, y, 3);
  }
  const background = [0, 1, 2].map((channel) => median(samples.map((rgb) => rgb[channel])));
  const close = (rgb: number[]) =>
    Math.max(...rgb.map((value, channel) => Math.abs(value - background[channel]))) <=
    EDGE_DISTANCE;
  const corners = [0, width - 1, (height - 1) * width, height * width - 1];
  if (corners.some((index) => colorDistance(pixels, index * 4, background) > EDGE_DISTANCE)) {
    return null;
  }
  if (sides.some((side) => side.filter(close).length / side.length < MIN_EDGE_AGREEMENT)) {
    return null;
  }

  // Flood fill only matching pixels connected to the outside. Interior whites/blacks remain content.
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (index: number) => {
    if (seen[index] || colorDistance(pixels, index * 4, background) > BACKGROUND_DISTANCE) return;
    seen[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x++) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index < width * (height - 1)) enqueue(index + width);
  }
  return contentBounds(pixels, width, height, (index) => seen[index] === 0);
};

/** Returns the original URL when trimming is uncertain or too small to matter. */
export const preprocessProductImage = (image: HTMLImageElement): string => {
  const original = image.src;
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  if (!sourceWidth || !sourceHeight) return original;

  try {
    const ratio = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * ratio));
    const height = Math.max(1, Math.round(sourceHeight * ratio));
    const analysis = document.createElement('canvas');
    analysis.width = width;
    analysis.height = height;
    const context = analysis.getContext('2d', { willReadFrequently: true });
    if (!context) return original;
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const hasTransparency = pixels.some((_, offset) => offset % 4 === 3 && pixels[offset] < 250);
    const bounds = hasTransparency
      ? contentBounds(pixels, width, height, (index) => pixels[index * 4 + 3] > ALPHA_THRESHOLD)
      : opaqueContentBounds(pixels, width, height);
    if (!bounds) return original;

    const marginX = Math.ceil((bounds.right - bounds.left) * SAFETY_MARGIN);
    const marginY = Math.ceil((bounds.bottom - bounds.top) * SAFETY_MARGIN);
    const left = Math.max(0, bounds.left - marginX);
    const top = Math.max(0, bounds.top - marginY);
    const right = Math.min(width, bounds.right + marginX);
    const bottom = Math.min(height, bounds.bottom + marginY);
    const removedArea = 1 - ((right - left) * (bottom - top)) / (width * height);

    const sourceLeft = Math.floor(left / ratio);
    const sourceTop = Math.floor(top / ratio);
    const sourceRight = Math.min(sourceWidth, Math.ceil(right / ratio));
    const sourceBottom = Math.min(sourceHeight, Math.ceil(bottom / ratio));
    if (removedArea < MIN_REMOVED_AREA) return original;
    const output = document.createElement('canvas');
    output.width = sourceRight - sourceLeft;
    output.height = sourceBottom - sourceTop;
    const outputContext = output.getContext('2d');
    if (!outputContext) return original;
    outputContext.drawImage(
      image,
      sourceLeft,
      sourceTop,
      output.width,
      output.height,
      0,
      0,
      output.width,
      output.height
    );
    return output.toDataURL('image/png');
  } catch (error) {
    // Canvas can reject very large or unreadable images. Keep the original usable.
    console.warn('图片自动裁边已跳过', error);
    return original;
  }
};
