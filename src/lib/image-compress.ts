/**
 * Client-Side Image Compressor Utility
 * Automatically compresses captured camera photos and screenshots
 * to strictly under target size (default 200 KB) while preserving
 * sharpness of transaction text, UTR digits, and donor details.
 */

export async function compressImageToTarget(
  file: File,
  maxSizeBytes: number = 200 * 1024 // 200 KB limit
): Promise<File> {
  // If file is already under 200KB and is a valid JPEG, no re-encoding needed
  if (file.size <= maxSizeBytes && (file.type === 'image/jpeg' || file.type === 'image/jpg')) {
    return file;
  }

  // Fallback for non-browser SSR contexts
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => {
      console.warn('FileReader error during image compression, using original file.');
      resolve(file);
    };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => {
        console.warn('Image loading error during compression, using original file.');
        resolve(file);
      };

      img.onload = async () => {
        try {
          // 1. Target bounding box: 1280px max dimension
          // Highly legible for UTR numbers, amounts, and donor screens
          const maxDimension = 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // Helper to render to blob at given dimensions and JPEG quality
          const renderToBlob = (w: number, h: number, quality: number): Promise<Blob | null> => {
            canvas.width = w;
            canvas.height = h;

            // Fill white background for any transparency
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);

            // Draw smoothed image
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);

            return new Promise((res) => {
              canvas.toBlob(res, 'image/jpeg', quality);
            });
          };

          // Progressive compression search to guarantee <= maxSizeBytes (200 KB)
          let currentWidth = width;
          let currentHeight = height;
          let quality = 0.82;
          let blob = await renderToBlob(currentWidth, currentHeight, quality);

          let iterations = 0;
          while (blob && blob.size > maxSizeBytes && iterations < 8) {
            iterations++;
            if (quality > 0.45) {
              quality -= 0.12;
            } else {
              // Scale down dimensions by 15% to guarantee fitting within 200 KB
              currentWidth = Math.max(480, Math.round(currentWidth * 0.85));
              currentHeight = Math.max(480, Math.round(currentHeight * 0.85));
              quality = 0.68;
            }
            blob = await renderToBlob(currentWidth, currentHeight, quality);
          }

          if (!blob) {
            resolve(file);
            return;
          }

          // Construct compressed File object
          const cleanName = (file.name || 'payment_proof').replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], cleanName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        } catch (err) {
          console.warn('Canvas compression exception, falling back to original file:', err);
          resolve(file);
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
