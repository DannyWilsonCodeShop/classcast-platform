/**
 * Utilities for inferring and normalizing file MIME types, particularly for mobile uploads
 */

const EXTENSION_TO_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  hevc: 'video/quicktime',
  heic: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/webm',
  avi: 'video/x-msvideo',
  wmv: 'video/x-ms-wmv',
  mpg: 'video/mpeg',
  mpeg: 'video/mpeg',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
  '3gp': 'video/3gpp',
  '3gpp': 'video/3gpp',
  '3g2': 'video/3gpp2',
};

const MIME_TYPE_ALIASES: Record<string, string> = {
  'video/x-m4v': 'video/mp4',
  'video/mpeg': 'video/mp4',
  'video/3gpp': 'video/mp4',
  'video/3gpp2': 'video/mp4',
  'application/octet-stream': '',
};

export interface MimeResolutionResult {
  /**
   * Raw MIME type detected from the File object or inferred from extension
   */
  detectedType: string | null;
  /**
   * Canonical MIME type that should be used for validation / uploading
   */
  canonicalType: string | null;
  /**
   * Whether the canonical type is allowed
   */
  isAllowed: boolean;
  /**
   * Diagnostics explaining how the type was determined
   */
  resolutionLog: string[];
}

const DEFAULT_FALLBACK_TYPE = 'application/octet-stream';

const normalizeString = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.toLowerCase().trim();
};

const inferFromExtension = (fileName: string): { type: string | null; log: string } => {
  const parts = fileName.split('.');
  if (parts.length < 2) {
    return { type: null, log: 'No file extension detected' };
  }

  const extension = normalizeString(parts.pop());
  if (!extension) {
    return { type: null, log: 'File extension empty after normalization' };
  }

  const inferred = EXTENSION_TO_MIME[extension] || null;
  return {
    type: inferred,
    log: inferred
      ? `Inferred MIME type "${inferred}" from extension ".${extension}"`
      : `Extension ".${extension}" is not mapped to a MIME type`,
  };
};

const resolveAlias = (mimeType: string | null): { type: string | null; log: string } => {
  if (!mimeType) {
    return { type: null, log: 'No MIME type provided for alias resolution' };
  }

  const normalized = normalizeString(mimeType);
  if (!normalized) {
    return { type: null, log: 'Normalized MIME type is empty' };
  }

  const alias = MIME_TYPE_ALIASES[normalized];
  if (alias === undefined) {
    return { type: normalized, log: `Using MIME type "${normalized}" without alias mapping` };
  }

  if (!alias) {
    return { type: null, log: `Alias map resolved "${normalized}" to empty value` };
  }

  return { type: alias, log: `Mapped MIME type "${normalized}" to canonical "${alias}" via alias map` };
};

/**
 * Resolve the most appropriate MIME type for a file, attempting to match provided allowed types.
 */
export function resolveMimeType(
  file: File,
  allowedTypes: string[]
): MimeResolutionResult {
  const resolutionLog: string[] = [];

  const allowedSet = new Set(allowedTypes.map(normalizeString));

  const rawType = normalizeString(file?.type);
  if (rawType) {
    resolutionLog.push(`Raw file.type detected: "${rawType}"`);
  } else {
    resolutionLog.push('Raw file.type missing or empty.');
  }

  let detectedType: string | null = rawType || null;

  if (!detectedType) {
    const { type, log } = inferFromExtension(file?.name || '');
    resolutionLog.push(log);
    detectedType = type;
  }

  if (!detectedType) {
    resolutionLog.push('Unable to determine MIME type from file metadata or extension.');
    return {
      detectedType: null,
      canonicalType: null,
      isAllowed: false,
      resolutionLog,
    };
  }

  const { type: canonicalFromAlias, log: aliasLog } = resolveAlias(detectedType);
  resolutionLog.push(aliasLog);

  let canonicalType = canonicalFromAlias;
  if (!canonicalType) {
    resolutionLog.push('Canonical MIME type could not be resolved.');
    return {
      detectedType,
      canonicalType: null,
      isAllowed: false,
      resolutionLog,
    };
  }

  if (!allowedSet.size) {
    resolutionLog.push('Allowed types list empty; accepting canonical MIME type.');
    return {
      detectedType,
      canonicalType,
      isAllowed: true,
      resolutionLog,
    };
  }

  if (allowedSet.has(canonicalType)) {
    resolutionLog.push(`Canonical MIME type "${canonicalType}" is allowed.`);
    return {
      detectedType,
      canonicalType,
      isAllowed: true,
      resolutionLog,
    };
  }

  if (allowedSet.has(detectedType)) {
    resolutionLog.push(
      `Detected MIME type "${detectedType}" matches allowed list even though canonical "${canonicalType}" does not.`
    );
    return {
      detectedType,
      canonicalType: detectedType,
      isAllowed: true,
      resolutionLog,
    };
  }

  resolutionLog.push(
    `MIME type "${detectedType}" (canonical "${canonicalType}") not found in allowed list: [${Array.from(allowedSet).join(', ')}]`
  );

  return {
    detectedType,
    canonicalType,
    isAllowed: false,
    resolutionLog,
  };
}

/**
 * Fallback MIME type to use when none can be determined confidently.
 */
export function getFallbackMimeType(): string {
  return DEFAULT_FALLBACK_TYPE;
}


