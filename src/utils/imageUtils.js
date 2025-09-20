/**
 * Image utility functions for avatar processing
 */

/**
 * Crops the top portion of an image to create a mini/head avatar
 * @param {File} imageFile - The original image file
 * @param {number} cropRatio - Ratio of height to keep (0.3 = top 30%)
 * @returns {Promise<Blob>} - Cropped image as blob
 */
export async function cropToMiniAvatar(imageFile, cropRatio = 0.35) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function imgOnLoad() {
      try {
        // Calculate crop dimensions - take top portion of image
        const sourceWidth = img.width;
        const sourceHeight = img.height;
        const cropHeight = Math.floor(sourceHeight * cropRatio);

        // Set canvas size to square (64x64 is good for mini avatars)
        const targetSize = 64;
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Draw the cropped and resized image
        ctx.drawImage(
          img,
          0,
          0,
          sourceWidth,
          cropHeight, // source: full width, top portion
          0,
          0,
          targetSize,
          targetSize, // destination: square canvas
        );

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png', 0.9);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    try {
      img.src = URL.createObjectURL(imageFile);
    } catch (error) {
      reject(new Error(`Failed to create object URL: ${error.message}`));
    }
  });
}

/**
 * Resizes an image to specific dimensions
 * @param {File} imageFile - The original image file
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {Promise<Blob>} - Resized image as blob
 */
export async function resizeImage(imageFile, maxWidth = 256, maxHeight = 256, maintainAspectRatio = true) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function imgOnLoad() {
      try {
        let { width, height } = img;

        if (maintainAspectRatio) {
          // Calculate new dimensions while maintaining aspect ratio
          const aspectRatio = width / height;

          if (width > height) {
            if (width > maxWidth) {
              width = maxWidth;
              height = width / aspectRatio;
            }
          } else if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }

          // Ensure we don't exceed max dimensions
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
        } else {
          width = maxWidth;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw the resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png', 0.9);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    try {
      img.src = URL.createObjectURL(imageFile);
    } catch (error) {
      reject(new Error(`Failed to create object URL: ${error.message}`));
    }
  });
}

/**
 * Generates a unique avatar name
 * @param {number} index - Avatar index in room
 * @returns {string} - Generated avatar name
 */
export function generateAvatarName(index) {
  return `avatar_${index + 1}`;
}

/**
 * Creates a preview URL for a file or blob
 * @param {File|Blob} fileOrBlob - Image file or blob
 * @returns {string} - Blob URL for preview
 */
export function createPreviewURL(fileOrBlob) {
  return URL.createObjectURL(fileOrBlob);
}

/**
 * Revokes a preview URL to free memory
 * @param {string} url - Blob URL to revoke
 */
export function revokePreviewURL(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
