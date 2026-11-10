import { ImageAnnotatorClient } from '@google-cloud/vision';

export class VisionServiceError extends Error {
  constructor(message = 'Image analysis is temporarily unavailable.', code = 'VISION_UNAVAILABLE') {
    super(message);
    this.name = 'VisionServiceError';
    this.code = code;
  }
}

/** ADC resolves local gcloud credentials or the App Engine runtime identity. */
export function createVisionDetector({ client = new ImageAnnotatorClient() } = {}) {
  return async function detectLabels(buffer) {
    try {
      const [result] = await client.annotateImage({
        image: { content: buffer },
        features: [{ type: 'LABEL_DETECTION', maxResults: 10 }],
      }, { timeout: 15000, retry: null });
      // Vision may return a per-image error even when the HTTP/RPC succeeded.
      if (result.error?.code || result.error?.message) throw new VisionServiceError();
      return (result.labelAnnotations ?? []).map(({ description, score }) => ({ description, score }));
    } catch (error) {
      if (error instanceof VisionServiceError) throw error;
      throw new VisionServiceError(undefined, error?.code === 4 ? 'VISION_TIMEOUT' : 'VISION_UNAVAILABLE');
    }
  };
}

/** Illustrative fixtures only. This does not inspect the image or call Google. */
export async function demoDetector() {
  return [
    { description: 'Landscape (simulated)', score: 0.98 },
    { description: 'Mountain (simulated)', score: 0.94 },
    { description: 'Sky (simulated)', score: 0.91 },
    { description: 'Illustration (simulated)', score: 0.87 },
  ];
}
