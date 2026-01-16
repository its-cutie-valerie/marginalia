/**
 * Image processing utilities for improving OCR accuracy
 */

export interface ImageSettings {
    brightness: number;     // -100 to 100
    contrast: number;       // -100 to 100
    sharpness: number;      // 0 to 100
    scale: number;          // 1 to 4
    grayscale: boolean;
    invert: boolean;
    threshold: number;      // 0 (off) to 255
}

export const DEFAULT_SETTINGS: ImageSettings = {
    brightness: 0,
    contrast: 0,
    sharpness: 0,
    scale: 1,
    grayscale: false,
    invert: false,
    threshold: 0,
};

/**
 * Apply all image processing settings to an image
 */
export async function processImage(
    imageDataUrl: string,
    settings: ImageSettings
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                // Calculate scaled dimensions
                const scaledWidth = Math.round(img.width * settings.scale);
                const scaledHeight = Math.round(img.height * settings.scale);

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = scaledWidth;
                canvas.height = scaledHeight;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Enable image smoothing for upscaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw scaled image
                ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

                // Get image data for pixel manipulation
                let imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

                // Apply grayscale first if enabled
                if (settings.grayscale) {
                    imageData = applyGrayscale(imageData);
                }

                // Apply brightness and contrast
                if (settings.brightness !== 0 || settings.contrast !== 0) {
                    imageData = applyBrightnessContrast(
                        imageData,
                        settings.brightness,
                        settings.contrast
                    );
                }

                // Apply threshold (binarization) - great for text
                if (settings.threshold > 0) {
                    imageData = applyThreshold(imageData, settings.threshold);
                }

                // Apply invert
                if (settings.invert) {
                    imageData = applyInvert(imageData);
                }

                // Put processed image back
                ctx.putImageData(imageData, 0, 0);

                // Apply sharpening (uses convolution, needs to work on canvas directly)
                if (settings.sharpness > 0) {
                    const sharpened = applySharpen(ctx, scaledWidth, scaledHeight, settings.sharpness);
                    ctx.putImageData(sharpened, 0, 0);
                }

                resolve(canvas.toDataURL('image/png'));
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageDataUrl;
    });
}

function applyGrayscale(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        data[i] = avg;     // R
        data[i + 1] = avg; // G
        data[i + 2] = avg; // B
    }
    return imageData;
}

function applyBrightnessContrast(
    imageData: ImageData,
    brightness: number,
    contrast: number
): ImageData {
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
        // Apply contrast
        data[i] = clamp(factor * (data[i] - 128) + 128 + brightness);
        data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128 + brightness);
        data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128 + brightness);
    }
    return imageData;
}

function applyThreshold(imageData: ImageData, threshold: number): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const val = avg > threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }
    return imageData;
}

function applyInvert(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
    }
    return imageData;
}

function applySharpen(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number
): ImageData {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);

    // Unsharp mask kernel intensity based on amount (0-100)
    const strength = amount / 100;

    // Sharpening kernel
    const kernel = [
        0, -strength, 0,
        -strength, 1 + 4 * strength, -strength,
        0, -strength, 0
    ];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                        sum += copy[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
                    }
                }
                const idx = (y * width + x) * 4 + c;
                data[idx] = clamp(sum);
            }
        }
    }

    return imageData;
}

function clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Quick presets for common scenarios
 */
export const PRESETS = {
    default: { ...DEFAULT_SETTINGS },
    darkBackground: {
        ...DEFAULT_SETTINGS,
        invert: true,
        contrast: 20,
    },
    lowContrast: {
        ...DEFAULT_SETTINGS,
        contrast: 40,
        sharpness: 30,
    },
    blurry: {
        ...DEFAULT_SETTINGS,
        scale: 2,
        sharpness: 50,
        contrast: 20,
    },
    screenshot: {
        ...DEFAULT_SETTINGS,
        sharpness: 20,
    },
    textOnly: {
        ...DEFAULT_SETTINGS,
        grayscale: true,
        contrast: 30,
        threshold: 128,
    },
} as const;

export type PresetName = keyof typeof PRESETS;
