/**
 * AR Wall Detection Module
 * Detects flat wall planes from camera feed using edge and depth analysis.
 * Robust and error-tolerant implementation.
 */

export class ARWallDetector {
  constructor(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    this.detectedPlane = null;
    this.isDetecting = false;
    this.frameBuffer = [];
    this.maxFrameBuffer = 10;
  }

  /**
   * Start continuous wall detection from video feed
   */
  startDetection() {
    if (this.isDetecting) {
      console.warn('Wall detection already running');
      return;
    }

    this.isDetecting = true;
    this._detectFrame();
  }

  /**
   * Stop wall detection
   */
  stopDetection() {
    this.isDetecting = false;
  }

  /**
   * Detect walls in a single frame
   * Private method called recursively
   */
  _detectFrame = () => {
    if (!this.isDetecting) return;

    try {
      // Draw current frame to canvas
      if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
        this.ctx.drawImage(
          this.videoElement,
          0,
          0,
          this.canvasElement.width,
          this.canvasElement.height
        );

        // Analyze frame
        const imageData = this.ctx.getImageData(
          0,
          0,
          this.canvasElement.width,
          this.canvasElement.height
        );

        const plane = this._analyzeFrame(imageData);

        if (plane) {
          // Add to frame buffer for smoothing
          this.frameBuffer.push(plane);
          if (this.frameBuffer.length > this.maxFrameBuffer) {
            this.frameBuffer.shift();
          }

          // Use averaged result if consistent
          if (this.frameBuffer.length >= 3) {
            this.detectedPlane = this._smoothPlaneDetection(this.frameBuffer);
          }
        }
      }

      requestAnimationFrame(this._detectFrame);
    } catch (error) {
      console.error('Wall detection error:', error);
      requestAnimationFrame(this._detectFrame);
    }
  };

  /**
   * Analyze a single frame for wall planes
   * Returns plane data: {centroid, normal, distance, confidence}
   */
  _analyzeFrame(imageData) {
    try {
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Find dominant brightness regions (likely walls)
      const brightPixels = [];
      let totalBrightness = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        totalBrightness += brightness;

        // Detect non-saturated, non-dark regions (good for walls)
        if (brightness > 60 && brightness < 220) {
          const pixelIndex = i / 4;
          brightPixels.push({
            index: pixelIndex,
            brightness,
            x: pixelIndex % width,
            y: Math.floor(pixelIndex / width),
          });
        }
      }

      if (brightPixels.length < width * height * 0.1) {
        // Not enough valid pixels (less than 10% of frame)
        return null;
      }

      // Compute centroid
      const centroid = {
        x: brightPixels.reduce((sum, p) => sum + p.x, 0) / brightPixels.length,
        y: brightPixels.reduce((sum, p) => sum + p.y, 0) / brightPixels.length,
      };

      // Compute variance to estimate plane flatness
      const variance = brightPixels.reduce((sum, p) => {
        const dx = p.x - centroid.x;
        const dy = p.y - centroid.y;
        return sum + dx * dx + dy * dy;
      }, 0) / brightPixels.length;

      // Low variance = flat wall
      const flatness = 1.0 / (1.0 + Math.sqrt(variance) / 100);

      // Edge detection for wall boundaries
      const edges = this._detectEdges(data, width, height);

      // Estimate plane normal (perpendicular to largest edge direction)
      const normal = edges.length > 0
        ? this._estimateNormal(edges, width, height)
        : [0, 0, 1]; // Default: perpendicular to camera

      // Distance to wall (estimated from overall brightness)
      const avgBrightness = totalBrightness / (width * height);
      const distance = 3.0 + (avgBrightness / 255) * 5; // 3-8 meters estimated

      return {
        centroid,
        normal,
        distance,
        flatness,
        confidence: flatness * 0.8 + (edges.length / (width * height)) * 0.2,
        pixelCount: brightPixels.length,
      };
    } catch (error) {
      console.error('Frame analysis error:', error);
      return null;
    }
  }

  /**
   * Detect edges in the image (Sobel-like approach)
   */
  _detectEdges(data, width, height) {
    const edges = [];
    const threshold = 50;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // Simple edge detection
        const idx = (y * width + x) * 4;
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        const up = ((data[((y - 1) * width + x) * 4] +
          data[((y - 1) * width + x) * 4 + 1] +
          data[((y - 1) * width + x) * 4 + 2]) /
          3 -
          center) **
          2;
        const down = ((data[((y + 1) * width + x) * 4] +
          data[((y + 1) * width + x) * 4 + 1] +
          data[((y + 1) * width + x) * 4 + 2]) /
          3 -
          center) **
          2;
        const left = ((data[(y * width + (x - 1)) * 4] +
          data[(y * width + (x - 1)) * 4 + 1] +
          data[(y * width + (x - 1)) * 4 + 2]) /
          3 -
          center) **
          2;
        const right = ((data[(y * width + (x + 1)) * 4] +
          data[(y * width + (x + 1)) * 4 + 1] +
          data[(y * width + (x + 1)) * 4 + 2]) /
          3 -
          center) **
          2;

        const edgeStrength = Math.sqrt(up + down + left + right);

        if (edgeStrength > threshold) {
          edges.push({ x, y, strength: edgeStrength });
        }
      }
    }

    return edges;
  }

  /**
   * Estimate plane normal from edges
   */
  _estimateNormal(edges, width, height) {
    if (edges.length === 0) return [0, 0, 1];

    // Find dominant edge direction using PCA-like approach
    const centerX = width / 2;
    const centerY = height / 2;

    let xx = 0, yy = 0, xy = 0;

    edges.forEach((edge) => {
      const dx = (edge.x - centerX) * edge.strength;
      const dy = (edge.y - centerY) * edge.strength;
      xx += dx * dx;
      yy += dy * dy;
      xy += dx * dy;
    });

    // Eigenvalue decomposition to find principal direction
    const trace = xx + yy;
    const det = xx * yy - xy * xy;
    const discriminant = Math.sqrt(Math.max(0, trace * trace - 4 * det));
    const lambda1 = (trace + discriminant) / 2;

    // Normal perpendicular to edge direction
    let nx = xy;
    let ny = lambda1 - xx;
    const norm = Math.sqrt(nx * nx + ny * ny) + 1e-6;

    return [nx / norm, ny / norm, 1.0];
  }

  /**
   * Smooth plane detection across multiple frames
   */
  _smoothPlaneDetection(frameBuffer) {
    if (frameBuffer.length === 0) return null;

    // Average centroid
    const avgCentroid = {
      x: frameBuffer.reduce((sum, p) => sum + p.centroid.x, 0) / frameBuffer.length,
      y: frameBuffer.reduce((sum, p) => sum + p.centroid.y, 0) / frameBuffer.length,
    };

    // Average normal
    const avgNormal = [
      frameBuffer.reduce((sum, p) => sum + p.normal[0], 0) / frameBuffer.length,
      frameBuffer.reduce((sum, p) => sum + p.normal[1], 0) / frameBuffer.length,
      frameBuffer.reduce((sum, p) => sum + p.normal[2], 0) / frameBuffer.length,
    ];

    // Normalize normal vector
    const normalLen = Math.sqrt(avgNormal[0] ** 2 + avgNormal[1] ** 2 + avgNormal[2] ** 2);
    const normalizedNormal = [
      avgNormal[0] / normalLen,
      avgNormal[1] / normalLen,
      avgNormal[2] / normalLen,
    ];

    // Average other properties
    const avgDistance = frameBuffer.reduce((sum, p) => sum + p.distance, 0) / frameBuffer.length;
    const avgConfidence = frameBuffer.reduce((sum, p) => sum + p.confidence, 0) / frameBuffer.length;
    const avgFlatness = frameBuffer.reduce((sum, p) => sum + p.flatness, 0) / frameBuffer.length;

    return {
      centroid: avgCentroid,
      normal: normalizedNormal,
      distance: avgDistance,
      confidence: avgConfidence,
      flatness: avgFlatness,
    };
  }

  /**
   * Get current detected plane (null if not detected)
   */
  getDetectedPlane() {
    return this.detectedPlane;
  }

  /**
   * Check if wall detection has high confidence
   */
  hasHighConfidencePlane(threshold = 0.6) {
    return this.detectedPlane && this.detectedPlane.confidence >= threshold;
  }
}
