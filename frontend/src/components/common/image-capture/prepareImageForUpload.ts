/**
 * Resizes and compresses an image file before upload.
 * Handles EXIF orientation and target size constraints.
 * 
 * FAZ 40 T40-0 Shared Module Contract Compliance.
 */

export type PrepareImageOptions = {
  /** Uzun kenar üst sınırı (px). Varsayılan: 1600 */
  maxEdge?: number;
  /** JPEG kalitesi 0..1. Varsayılan: 0.8 */
  quality?: number;
  /** Çıktı MIME. Varsayılan: 'image/jpeg' */
  mimeType?: 'image/jpeg' | 'image/webp';
  /** Sonuç bu boyutun altındaysa kaliteyi düşürmeyi bırak (KB). Varsayılan: 600 */
  targetMaxKB?: number;
};

export type PrepareImageResult = {
  file: File;             // işlenmiş dosya (orijinal adı korunur, uzantı mime'a göre)
  width: number;
  height: number;
  originalBytes: number;
  outputBytes: number;
};

async function readExifOrientation(file: File): Promise<number> {
  if (!/jpe?g$/i.test(file.type.split('/')[1] || '')) return 1;

  try {
    const buffer = await file.slice(0, 65536).arrayBuffer();
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return 1;

    let offset = 2;
    while (offset + 4 < view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break;

      const marker = view.getUint8(offset + 1);
      const size = view.getUint16(offset + 2, false);
      if (marker === 0xe1) {
        const exifStart = offset + 4;
        const hasExif =
          view.getUint8(exifStart) === 0x45 &&
          view.getUint8(exifStart + 1) === 0x78 &&
          view.getUint8(exifStart + 2) === 0x69 &&
          view.getUint8(exifStart + 3) === 0x66 &&
          view.getUint8(exifStart + 4) === 0x00 &&
          view.getUint8(exifStart + 5) === 0x00;
        if (!hasExif) return 1;

        const tiffStart = exifStart + 6;
        const littleEndian = view.getUint16(tiffStart, false) === 0x4949;
        const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
        const ifdStart = tiffStart + firstIfdOffset;
        if (ifdStart + 2 > view.byteLength) return 1;

        const entryCount = view.getUint16(ifdStart, littleEndian);
        for (let i = 0; i < entryCount; i += 1) {
          const entryOffset = ifdStart + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) return 1;
          const tag = view.getUint16(entryOffset, littleEndian);
          if (tag === 0x0112) {
            return view.getUint16(entryOffset + 8, littleEndian);
          }
        }
        return 1;
      }

      offset += 2 + size;
    }
  } catch {
    return 1;
  }

  return 1;
}

function drawImageWithOrientation(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  orientation: number,
) {
  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      break;
  }

  ctx.drawImage(img, 0, 0, width, height);
}

export async function prepareImageForUpload(
  input: File,
  opts: PrepareImageOptions = {}
): Promise<PrepareImageResult> {
  const {
    maxEdge = 1600,
    quality = 0.8,
    mimeType = 'image/jpeg',
    targetMaxKB = 600
  } = opts;

  const originalBytes = input.size;

  if (!input.type.startsWith('image/')) {
    throw new Error('not_an_image');
  }

  const orientation = await readExifOrientation(input);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxEdge) {
            height = Math.round((height * maxEdge) / width);
            width = maxEdge;
          }
        } else {
          if (height > maxEdge) {
            width = Math.round((width * maxEdge) / height);
            height = maxEdge;
          }
        }

        const swapsDimensions = orientation >= 5 && orientation <= 8;
        const canvas = document.createElement('canvas');
        canvas.width = swapsDimensions ? height : width;
        canvas.height = swapsDimensions ? width : height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            file: input,
            width: img.width,
            height: img.height,
            originalBytes,
            outputBytes: originalBytes
          });
          return;
        }

        drawImageWithOrientation(ctx, img, width, height, orientation);

        let currentQuality = quality;
        let blob: Blob | null = null;
        
        // Iterative compression to hit targetMaxKB if possible
        while (currentQuality >= 0.5) {
          blob = await new Promise<Blob | null>(res => canvas.toBlob(res, mimeType, currentQuality));
          if (!blob) break;
          if (blob.size <= targetMaxKB * 1024) break;
          currentQuality -= 0.1;
        }

        if (!blob) {
          resolve({
            file: input,
            width: img.width,
            height: img.height,
            originalBytes,
            outputBytes: originalBytes
          });
          return;
        }

        const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';
        const baseName = input.name.replace(/\.[^/.]+$/, "");
        const newFile = new File([blob], `${baseName}${extension}`, {
          type: mimeType,
          lastModified: Date.now(),
        });

        resolve({
          file: newFile,
          width: canvas.width,
          height: canvas.height,
          originalBytes,
          outputBytes: newFile.size
        });
      };
      img.onerror = () => resolve({
        file: input,
        width: 0,
        height: 0,
        originalBytes,
        outputBytes: originalBytes
      });
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve({
      file: input,
      width: 0,
      height: 0,
      originalBytes,
      outputBytes: originalBytes
    });
    reader.readAsDataURL(input);
  });
}
