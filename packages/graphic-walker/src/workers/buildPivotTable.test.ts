import type { IViewField } from '../interfaces';
import { createPivotPathKey } from '../components/pivotTable/utils';
import { buildPivotTable } from './buildPivotTable';

const dimension = (fid: string): IViewField => ({
    fid,
    name: fid,
    analyticType: 'dimension',
    semanticType: 'nominal',
});

describe('buildPivotTable', () => {
    test('builds row and column trees with collapsed subtotals', () => {
        const data = [
            { region: 'East', city: 'Boston', year: '2024', sales_sum: 9 },
            { region: 'West', city: 'Seattle', year: '2024', sales_sum: 18 },
            { region: 'West', city: 'San Francisco', year: '2024', sales_sum: 12 },
        ];
        const result = buildPivotTable(
            [dimension('region'), dimension('city')],
            [dimension('year')],
            data,
            [{ region: 'West', year: '2024', sales_sum: 30 }],
            [createPivotPathKey([{ key: 'region', value: 'West' }])],
            false
        );

        expect(result.lt.children.find((node) => node.value === 'West')?.isCollapsed).toBe(true);
        expect(result.tt.children.map((node) => node.value)).toEqual(['2024']);
        expect(result.metric.map((row) => row[0]?.sales_sum)).toEqual([9, 30]);
    });

    test('sorts the opposite axis using the selected measure', () => {
        const data = [
            { region: 'East', year: '2024', sales_sum: 9 },
            { region: 'West', year: '2024', sales_sum: 30 },
        ];
        const result = buildPivotTable([dimension('region')], [dimension('year')], data, [], [], false, {
            fid: 'sales_sum',
            mode: 'row',
            type: 'descending',
        });

        expect(result.lt.children.map((node) => node.value)).toEqual(['West', 'East']);
    });

    test.each([
        { mode: 'row' as const, dimsInRow: [dimension('region')], dimsInColumn: [dimension('year')] },
        { mode: 'column' as const, dimsInRow: [dimension('region')], dimsInColumn: [dimension('year')] },
    ])('builds an empty model without throwing when $mode sorting is active', ({ mode, dimsInRow, dimsInColumn }) => {
        const result = buildPivotTable(dimsInRow, dimsInColumn, [], [], [], false, {
            fid: 'sales_sum',
            mode,
            type: 'descending',
        });

        expect(result.lt.children).toEqual([]);
        expect(result.tt.children).toEqual([]);
        expect(result.metric).toEqual([[undefined]]);
    });
});
