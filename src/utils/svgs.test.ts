import { describe, expect, test } from '@jest/globals'
import { toDataUrl, pathToSvg } from './svgs'
import type { IconInfo } from '../loader'

describe('SVG Utilities', () => {
  describe('toDataUrl', () => {
    test('should convert a string to a data URL with base64 encoding', () => {
      const input = '<svg>test</svg>'
      const result = toDataUrl(input)
      expect(result).toBe('data:image/svg+xml;base64,PHN2Zz50ZXN0PC9zdmc+')
    })

    test('should handle empty string', () => {
      const input = ''
      const result = toDataUrl(input)
      expect(result).toBe('data:image/svg+xml;base64,')
    })

    test('should handle special characters', () => {
      const input = '<svg width="100%">test & special chars</svg>'
      const result = toDataUrl(input)
      // The result should be a valid data URL with base64 encoding
      expect(result).toMatch(/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/)
    })
  })

  describe('pathToSvg', () => {
    test('should create an SVG string with correct dimensions and viewBox', () => {
      const info: IconInfo = {
        body: '<path d="M10 10"/>',
        width: 16,
        height: 16,
        key: 'test:test',
        ratio: 1,
        collection: 'test',
        id: 'test',
        // From IconifyIcon type
        left: 0,
        top: 0,
      }
      const fontSize = 32
      const result = pathToSvg(info, fontSize)
      
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"')
      expect(result).toContain('width="32px"')
      expect(result).toContain('height="32px"')
      expect(result).toContain('viewBox="0 0 16 16"')
      expect(result).toContain('<path d="M10 10"/>')
    })

    test('should calculate width based on ratio', () => {
      const info: IconInfo = {
        body: '<rect width="20" height="10"/>',
        width: 20,
        height: 10,
        key: 'test:test',
        ratio: 2, // width / height = 20 / 10 = 2
        collection: 'test',
        id: 'test',
        left: 0,
        top: 0,
      }
      const fontSize = 16
      const result = pathToSvg(info, fontSize)
      
      // With ratio 2 and fontSize 16, width should be 16 * 2 = 32
      expect(result).toContain('width="32px"')
      expect(result).toContain('height="16px"')
    })

    test('should maintain preserveAspectRatio attribute', () => {
      const info: IconInfo = {
        body: '<circle cx="8" cy="8" r="8"/>',
        width: 16,
        height: 16,
        key: 'test:test',
        ratio: 1,
        collection: 'test',
        id: 'test',
        left: 0,
        top: 0,
      }
      const fontSize = 24
      const result = pathToSvg(info, fontSize)
      
      expect(result).toContain('preserveAspectRatio="xMidYMid meet"')
    })

    test('should include xlink namespace', () => {
      const info: IconInfo = {
        body: '<use xlink:href="#test"/>',
        width: 16,
        height: 16,
        key: 'test:test',
        ratio: 1,
        collection: 'test',
        id: 'test',
        left: 0,
        top: 0,
      }
      const fontSize = 32
      const result = pathToSvg(info, fontSize)
      
      expect(result).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"')
    })

    test('should work with different font sizes', () => {
      const info: IconInfo = {
        body: '<rect x="0" y="0" width="16" height="16"/>',
        width: 16,
        height: 16,
        key: 'test:test',
        ratio: 1,
        collection: 'test',
        id: 'test',
        left: 0,
        top: 0,
      }
      
      const result16 = pathToSvg(info, 16)
      const result24 = pathToSvg(info, 24)
      const result48 = pathToSvg(info, 48)
      
      expect(result16).toContain('width="16px"')
      expect(result16).toContain('height="16px"')
      
      expect(result24).toContain('width="24px"')
      expect(result24).toContain('height="24px"')
      
      expect(result48).toContain('width="48px"')
      expect(result48).toContain('height="48px"')
    })
  })
})