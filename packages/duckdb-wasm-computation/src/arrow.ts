import { Vector } from 'apache-arrow';
import { bigNumToString, isArrowBigNumSymbol } from 'apache-arrow/util/bn';

function isArrowBigNum(value: object): boolean {
    return Boolean((value as Record<PropertyKey, unknown>)[isArrowBigNumSymbol]);
}

function safeIntegerOrString(value: string): number | string {
    const numberValue = Number(value);
    return Number.isSafeInteger(numberValue) ? numberValue : value;
}

export function arrowValueToJSON(value: unknown): unknown {
    if (value === null) {
        return null;
    }
    if (value instanceof Vector) {
        return Array.from(value).map(arrowValueToJSON);
    }
    if (typeof value === 'bigint') {
        return safeIntegerOrString(value.toString());
    }
    if (typeof value === 'object' && isArrowBigNum(value)) {
        return safeIntegerOrString(bigNumToString(value as Parameters<typeof bigNumToString>[0]));
    }
    return value;
}
