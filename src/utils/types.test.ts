import { isTruthy } from './types';

describe('isTruthy', () => {
  it('should return true for truthy values', () => {
    expect(isTruthy(1)).toBe(true);
    expect(isTruthy('hello')).toBe(true);
    expect(isTruthy(true)).toBe(true);
    expect(isTruthy({})).toBe(true);
    expect(isTruthy([])).toBe(true);
    expect(isTruthy(new Date())).toBe(true);
    expect(isTruthy(0.1)).toBe(true);
    expect(isTruthy(-1)).toBe(true);
    expect(isTruthy('0')).toBe(true); // string '0' is truthy
    expect(isTruthy('false')).toBe(true); // string 'false' is truthy
    expect(isTruthy(Symbol('test'))).toBe(true);
    expect(isTruthy(BigInt(123))).toBe(true);
  });

  it('should return false for falsy values', () => {
    expect(isTruthy(0)).toBe(false);
    expect(isTruthy('')).toBe(false);
    expect(isTruthy(false)).toBe(false);
    expect(isTruthy(null)).toBe(false);
    expect(isTruthy(undefined)).toBe(false);
    expect(isTruthy(NaN)).toBe(false);
  });

  it('should work as a type guard narrowing the type', () => {
    let value: string | undefined = 'hello';
    
    if (isTruthy(value)) {
      // At this point, TypeScript should know that value is of type 'string'
      // because isTruthy returned true, meaning it's not undefined
      expect(typeof value).toBe('string');
      expect(value).toBe('hello');
    }

    value = undefined;
    if (!isTruthy(value)) {
      // Here, the value could still be undefined or a falsy string, 
      // but if we know isTruthy returned false, we know it's not truthy
      expect(value).toBeUndefined();
    }
  });
  
  it('should work with different generic types', () => {
    // Test with number
    const numValue: number | undefined = 42;
    expect(isTruthy(numValue)).toBe(true);

    // Test with boolean
    const boolValue: boolean | undefined = true;
    expect(isTruthy(boolValue)).toBe(true);

    // Test with object
    const objValue: Record<string, unknown> | undefined = { test: 'value' };
    expect(isTruthy(objValue)).toBe(true);

    // Test with array
    const arrValue: string[] | undefined = ['a', 'b'];
    expect(isTruthy(arrValue)).toBe(true);
  });
});