import Base64 from './base64';

describe('Base64', () => {
  describe('encode', () => {
    it('should encode a simple string', () => {
      const input = 'hello';
      const expected = 'aGVsbG8=';
      const result = Base64.encode(input);
      expect(result).toBe(expected);
    });

    it('should encode an empty string', () => {
      const input = '';
      const expected = '';
      const result = Base64.encode(input);
      expect(result).toBe(expected);
    });

    it('should encode a string with special characters', () => {
      const input = 'hello world!';
      const expected = 'aGVsbG8gd29ybGQh';
      const result = Base64.encode(input);
      expect(result).toBe(expected);
    });

    it('should encode a string with unicode characters', () => {
      const input = 'café';
      const expected = 'Y2Fmw6k=';
      const result = Base64.encode(input);
      expect(result).toBe(expected);
    });

    it('should encode a string with newlines', () => {
      const input = 'hello\nworld';
      const expected = 'aGVsbG8Kd29ybGQ=';
      const result = Base64.encode(input);
      expect(result).toBe(expected);
    });

    it('should handle special characters and symbols', () => {
      const input = 'symbols: @#$%^&*()';
      const expected = 'c3ltYm9sczogQCMkJV4mKigp';
      const result = Base64.encode(input);
      expect(result).toBe(expected);
    });
  });

  describe('decode', () => {
    it('should decode a simple encoded string', () => {
      const input = 'aGVsbG8=';
      const expected = 'hello';
      const result = Base64.decode(input);
      expect(result).toBe(expected);
    });

    it('should decode an empty string', () => {
      const input = '';
      const expected = '';
      const result = Base64.decode(input);
      expect(result).toBe(expected);
    });

    it('should decode a string with special characters', () => {
      const input = 'aGVsbG8gd29ybGQh';
      const expected = 'hello world!';
      const result = Base64.decode(input);
      expect(result).toBe(expected);
    });

    it('should decode a string with unicode characters', () => {
      const input = 'Y2Fmw6k=';
      const expected = 'café';
      const result = Base64.decode(input);
      expect(result).toBe(expected);
    });

    it('should decode a string with newlines', () => {
      const input = 'aGVsbG8Kd29ybGQ=';
      const expected = 'hello\nworld';
      const result = Base64.decode(input);
      expect(result).toBe(expected);
    });

    it('should handle special characters and symbols', () => {
      const input = 'c3ltYm9sczogQCMkJV4mKigp';
      const expected = 'symbols: @#$%^&*()';
      const result = Base64.decode(input);
      expect(result).toBe(expected);
    });

    it('should handle malformed base64 with extra characters', () => {
      // Base64.decode removes non-base64 characters
      // This test ensures the function doesn't throw an error when given malformed input
      const input = 'aGVsbG8=invalid';
      expect(() => {
        const result = Base64.decode(input);
        // The function should handle the input without throwing an error
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should decode padded strings correctly', () => {
      const input = 'c3RyaW5n';
      const expected = 'string';
      const result = Base64.decode(input);
      expect(result).toBe(expected);
    });
  });

  describe('encode/decode roundtrip', () => {
    it('should encode and decode back to original string', () => {
      const original = 'hello world';
      const encoded = Base64.encode(original);
      const decoded = Base64.decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should work with empty string', () => {
      const original = '';
      const encoded = Base64.encode(original);
      const decoded = Base64.decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should work with unicode characters', () => {
      const original = 'Hello 世界';
      const encoded = Base64.encode(original);
      const decoded = Base64.decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should work with special characters', () => {
      const original = 'Test: !@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const encoded = Base64.encode(original);
      const decoded = Base64.decode(encoded);
      expect(decoded).toBe(original);
    });
  });
});