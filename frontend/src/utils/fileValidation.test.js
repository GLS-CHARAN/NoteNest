import { describe, expect, it } from 'vitest';
import { validateFile, MAX_IMAGE_BYTES, formatBytes } from './fileValidation.js';

const makeFile = (name, type, size = 1000) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('validateFile', () => {
  it('accepts a normal PNG', () => {
    expect(validateFile(makeFile('a.png', 'image/png'))).toBeNull();
  });
  it('accepts an MP4 video', () => {
    expect(validateFile(makeFile('clip.mp4', 'video/mp4'))).toBeNull();
  });
  it('rejects unsupported types', () => {
    expect(validateFile(makeFile('doc.pdf', 'application/pdf'))).toMatch(/only JPEG/);
  });
  it('rejects a mismatched extension', () => {
    expect(validateFile(makeFile('a.exe', 'image/png'))).toMatch(/extension/);
  });
  it('rejects oversized images', () => {
    expect(validateFile(makeFile('big.jpg', 'image/jpeg', MAX_IMAGE_BYTES + 1))).toMatch(/larger than 10 MB/);
  });
  it('formats sizes', () => {
    expect(formatBytes(2048)).toBe('2 KB');
  });
});
