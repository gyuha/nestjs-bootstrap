// src/shared/utils/file.util.spec.ts
import {
  formatFileSize,
  getExtension,
  getMimeType,
  isImageFile,
} from './file.util';

describe('file.util', () => {
  describe('getMimeType', () => {
    it('returns correct mime for .jpg', () => {
      expect(getMimeType('photo.jpg')).toBe('image/jpeg');
    });

    it('returns correct mime for .png', () => {
      expect(getMimeType('icon.PNG')).toBe('image/png');
    });

    it('returns application/octet-stream for unknown extension', () => {
      expect(getMimeType('file.xyz')).toBe('application/octet-stream');
    });
  });

  describe('getExtension', () => {
    it('returns extension including dot', () => {
      expect(getExtension('file.txt')).toBe('.txt');
    });

    it('returns empty string when no extension', () => {
      expect(getExtension('README')).toBe('');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });
  });

  describe('isImageFile', () => {
    it('returns true for image files', () => {
      expect(isImageFile('photo.jpg')).toBe(true);
      expect(isImageFile('icon.PNG')).toBe(true);
      expect(isImageFile('img.webp')).toBe(true);
    });

    it('returns false for non-image files', () => {
      expect(isImageFile('document.pdf')).toBe(false);
      expect(isImageFile('archive.zip')).toBe(false);
    });
  });
});
