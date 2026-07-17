import { BN } from 'apache-arrow/util/bn';
import { arrowValueToJSON } from '../src/arrow';

describe('arrowValueToJSON', () => {
    test('preserves SQL null values', () => {
        expect(arrowValueToJSON(null)).toBeNull();
    });

    test('converts Arrow big numbers and native bigints', () => {
        expect(arrowValueToJSON(BN.signed(new Int32Array([42, 0])))).toBe(42);
        expect(arrowValueToJSON((globalThis as any).BigInt(42))).toBe(42);
    });

    test('does not treat arbitrary Arrow-compatible objects as big numbers', () => {
        const value = { nested: 'value' };
        expect(arrowValueToJSON(value)).toBe(value);
    });

    test('preserves adjacent integers above the safe number range as distinct strings', () => {
        const first = BN.signed(new Int32Array([0, 2_097_152]));
        const second = BN.signed(new Int32Array([1, 2_097_152]));
        const nativeMaxSafe = (globalThis as any).BigInt('9007199254740991');

        expect(arrowValueToJSON(nativeMaxSafe)).toBe(Number.MAX_SAFE_INTEGER);
        expect(arrowValueToJSON(first)).toBe('9007199254740992');
        expect(arrowValueToJSON(second)).toBe('9007199254740993');
        expect(arrowValueToJSON(first)).not.toBe(arrowValueToJSON(second));
    });
});
