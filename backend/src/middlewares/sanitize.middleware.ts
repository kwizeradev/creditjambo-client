import { Request, Response, NextFunction } from 'express';

const MAX_STRING_LENGTH = parseInt(process.env.MAX_INPUT_STRING_LENGTH || '10000');
const MAX_OBJECT_DEPTH = parseInt(process.env.MAX_INPUT_OBJECT_DEPTH || '10');

export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  try {
    if (req.body) {
      req.body = sanitizeData(req.body);
    }

    if (req.query) {
      const sanitized = sanitizeData(req.query);
      Object.keys(req.query).forEach((key) => delete req.query[key]);
      Object.assign(req.query, sanitized);
    }

    if (req.params) {
      const sanitized = sanitizeData(req.params);
      Object.keys(req.params).forEach((key) => delete req.params[key]);
      Object.assign(req.params, sanitized);
    }

    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    sendLimitExceededResponse(res);
  }
}

function sanitizeData(data: unknown): unknown {
  return data ? sanitizeObject(data, 0) : data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeObject(obj: any, depth: number = 0): any {
  validateDepth(depth);

  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return sanitizeArray(obj, depth);
  if (isPlainObject(obj)) return sanitizeObjectProperties(obj, depth);

  return obj;
}

function validateDepth(depth: number): void {
  if (depth > MAX_OBJECT_DEPTH) {
    throw new Error('Object depth limit exceeded');
  }
}

function sanitizeArray(arr: unknown[], depth: number): unknown[] {
  return arr.map((item) => sanitizeObject(item, depth + 1));
}

function sanitizeObjectProperties(
  obj: Record<string, unknown>,
  depth: number,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key], depth + 1);
    }
  }

  return sanitized;
}

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object';
}

function sanitizeString(str: string): string {
  validateStringLength(str);
  return escapeHtmlCharacters(removeScriptTags(str));
}

function validateStringLength(str: string): void {
  if (str.length > MAX_STRING_LENGTH) {
    throw new Error('String length limit exceeded');
  }
}

function removeScriptTags(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

function escapeHtmlCharacters(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function preventNoSQLInjection(req: Request, res: Response, next: NextFunction): void {
  try {
    if (req.body) {
      req.body = removeNoSQLOperators(req.body);
    }

    if (req.query) {
      const cleaned = removeNoSQLOperators(req.query);
      Object.keys(req.query).forEach((key) => delete req.query[key]);
      Object.assign(req.query, cleaned);
    }

    if (req.params) {
      const cleaned = removeNoSQLOperators(req.params);
      Object.keys(req.params).forEach((key) => delete req.params[key]);
      Object.assign(req.params, cleaned);
    }

    next();
  } catch (error) {
    console.error('NoSQL injection prevention error:', error);
    sendLimitExceededResponse(res);
  }
}

function removeNoSQLOperators(data: unknown): unknown {
  return data ? cleanObject(data, 0) : data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanObject(obj: any, depth: number = 0): any {
  validateDepth(depth);

  if (!isPlainObject(obj)) return obj;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleaned: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && isValidKey(key)) {
      cleaned[key] = cleanObject(obj[key], depth + 1);
    }
  }

  return cleaned;
}

function isValidKey(key: string): boolean {
  return !key.includes('$') && !key.includes('.');
}

function sendLimitExceededResponse(res: Response): void {
  res.status(400).json({
    status: 'error',
    message: 'Request data exceeds allowed limits',
  });
}
