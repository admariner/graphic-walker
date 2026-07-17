import { shouldRenderPivotTableModel, togglePivotTablePath } from './core';
import type { IPivotTableModel } from './interface';

describe('PivotTableCore state helpers', () => {
    const west = [{ key: 'region', value: 'West' }];
    const seattle = [
        { key: 'region', value: 'West' },
        { key: 'city', value: 'Seattle' },
    ];
    const east = [{ key: 'region', value: 'East' }];

    test('adds and removes a collapsed path', () => {
        expect(togglePivotTablePath([], west)).toEqual([west]);
        expect(togglePivotTablePath([west], west)).toEqual([]);
    });

    test('removes descendant paths when a parent is collapsed', () => {
        expect(togglePivotTablePath([seattle, east], west)).toEqual([east, west]);
    });

    test('toggles paths containing NaN as the same controlled value', () => {
        const nanPath = [{ key: 'score', value: Number.NaN }];

        expect(togglePivotTablePath([nanPath], [{ key: 'score', value: Number.NaN }])).toEqual([]);
    });

    test('renders emptyContent instead of an empty metric placeholder', () => {
        expect(shouldRenderPivotTableModel(null)).toBe(false);
        expect(shouldRenderPivotTableModel({ isEmpty: true } as IPivotTableModel)).toBe(false);
        expect(shouldRenderPivotTableModel({ isEmpty: false } as IPivotTableModel)).toBe(true);
    });
});
