import sharp from 'sharp';

type RGB = [number, number, number];

export interface PixelAnalysisOptions {
  maxColors?: number; // 3-8
  resize?: { maxWidth?: number; maxHeight?: number };
}

export interface PixelAnalysisResult {
  dominantColor: { rgb: RGB; hex: string; hsl: [number, number, number]; confidence: number };
  palette: Array<{ rgb: RGB; hex: string; percentage: number }>;
}

export async function analyzeImageFromBase64(
  imageBase64: string,
  options: PixelAnalysisOptions = {}
): Promise<PixelAnalysisResult> {
  const maxColors = Math.max(3, Math.min(options.maxColors ?? 5, 8));
  const resizeMaxW = options.resize?.maxWidth ?? 224;
  const resizeMaxH = options.resize?.maxHeight ?? 224;

  // Quitar encabezado dataURL si viene
  const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const input = Buffer.from(base64, 'base64');

  // Preprocesar imagen: rotar según EXIF, redimensionar, quitar alpha, obtener píxeles RAW
  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: resizeMaxW,
      height: resizeMaxH,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // debe ser 3 (RGB)
  const pixels: RGB[] = [];

  // Muestrear píxeles con paso para acelerar (stride)
  const stride = Math.max(1, Math.floor((info.width * info.height) / 5000));
  for (let i = 0, idx = 0; i < data.length; i += channels * stride, idx += stride) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    pixels.push([r, g, b]);
  }

  // K-Means simple
  const clusters = kmeans(pixels, maxColors, 10);

  // Paleta ordenada por frecuencia
  const total = clusters.reduce((s, c) => s + c.count, 0);
  const palette = clusters
    .sort((a, b) => b.count - a.count)
    .map((c) => ({
      rgb: c.centroid as RGB,
      hex: rgbToHex(c.centroid[0], c.centroid[1], c.centroid[2]),
      percentage: Math.round((c.count / total) * 100),
    }));

  const dominant = palette[0];
  const hsl = rgbToHsl(dominant.rgb[0], dominant.rgb[1], dominant.rgb[2]);
  const confidence = Math.min(95, Math.max(60, dominant.percentage));

  return {
    dominantColor: { rgb: dominant.rgb, hex: dominant.hex, hsl, confidence },
    palette,
  };
}

// --- Utilidades ---

function kmeans(pixels: RGB[], k: number, iterations: number) {
  // Inicialización: elegir k puntos aleatorios
  const centroids: [number, number, number][] = [];
  for (let i = 0; i < k; i++) {
    const p = pixels[Math.floor(Math.random() * pixels.length)];
    centroids.push([p[0], p[1], p[2]]);
  }

  let clusters: { centroid: [number, number, number]; points: RGB[]; count: number }[] = [];
  for (let it = 0; it < iterations; it++) {
    clusters = centroids.map((c) => ({ centroid: c, points: [], count: 0 }));

    for (const p of pixels) {
      let best = 0;
      let bestDist = dist2(p, centroids[0]);
      for (let i = 1; i < centroids.length; i++) {
        const d = dist2(p, centroids[i]);
        if (d < bestDist) {
          best = i;
          bestDist = d;
        }
      }
      clusters[best].points.push(p);
      clusters[best].count++;
    }

    let moved = false;
    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].points.length === 0) continue;
      const mean: [number, number, number] = [0, 0, 0];
      for (const p of clusters[i].points) {
        mean[0] += p[0];
        mean[1] += p[1];
        mean[2] += p[2];
      }
      mean[0] = Math.round(mean[0] / clusters[i].points.length);
      mean[1] = Math.round(mean[1] / clusters[i].points.length);
      mean[2] = Math.round(mean[2] / clusters[i].points.length);
      if (mean[0] !== centroids[i][0] || mean[1] !== centroids[i][1] || mean[2] !== centroids[i][2]) {
        moved = true;
      }
      centroids[i] = mean;
    }
    if (!moved) break;
  }

  return centroids.map((c, i) => ({ centroid: c, points: clusters[i]?.points ?? [], count: clusters[i]?.count ?? 0 }));
}

function dist2(a: RGB, b: RGB) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}


