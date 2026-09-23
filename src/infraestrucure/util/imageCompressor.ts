import zlib from 'zlib';

export interface CompressedImageResult {
  compressedBuffer: Buffer;
  mimeType: string;
}

/**
 * Comprime una imagen en formato Base64 a un Buffer binario usando gzip.
 * Soporta tanto Data URLs (data:image/png;base64,...) como Base64 puros.
 */
export function compressImage(base64String: string): CompressedImageResult {
  if (!base64String || typeof base64String !== 'string') {
    throw new Error('La imagen proporcionada en Base64 no es válida.');
  }

  let mimeType = 'image/jpeg';
  let cleanBase64 = base64String.trim();

  // Detectar formato Data URI (data:image/png;base64,...)
  const match = cleanBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    cleanBase64 = match[2];
  }

  const rawBuffer = Buffer.from(cleanBase64, 'base64');
  const compressedBuffer = zlib.gzipSync(rawBuffer, { level: 9 }); // Nivel máximo de compresión

  return {
    compressedBuffer,
    mimeType,
  };
}

/**
 * Descomprime un Buffer binario (almacenado como BYTEA) y lo reconstruye
 * como una cadena Base64 con su prefijo Data URL correspondiente.
 */
export function decompressImage(
  compressedBuffer?: Buffer | null,
  mimeType?: string | null
): string | undefined {
  if (!compressedBuffer || compressedBuffer.length === 0) {
    return undefined;
  }

  try {
    // Intentar descompresión gzip
    const decompressedBuffer = zlib.gunzipSync(compressedBuffer);
    const base64Data = decompressedBuffer.toString('base64');
    const actualMimeType = mimeType || 'image/jpeg';
    return `data:${actualMimeType};base64,${base64Data}`;
  } catch (error) {
    // Si por alguna razón el buffer guardado no era gzip (ej. datos legacy sin comprimir)
    const base64Data = compressedBuffer.toString('base64');
    const actualMimeType = mimeType || 'image/jpeg';
    return `data:${actualMimeType};base64,${base64Data}`;
  }
}
