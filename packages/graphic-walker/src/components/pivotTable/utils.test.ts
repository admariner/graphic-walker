import { buildMetricTableFromNestTree, buildNestTree, createPivotPathKey } from './utils';

describe('pivot table model utilities', () => {
    const rows = [
        { region: 'West', city: 'San Francisco', year: 2024, sales_sum: 12 },
        { region: 'West', city: 'Seattle', year: 2024, sales_sum: 18 },
        { region: 'East', city: 'Boston', year: 2024, sales_sum: 9 },
        { region: 'East', city: 'Boston', year: 2025, sales_sum: 11 },
    ];

    test('creates collision-safe keys for structured paths', () => {
        expect(createPivotPathKey([{ key: 'region', value: 'West__Seattle' }])).not.toBe(
            createPivotPathKey([
                { key: 'region', value: 'West' },
                { key: 'city', value: 'Seattle' },
            ])
        );
        expect(createPivotPathKey([{ key: 'year', value: 2024 }])).not.toBe(createPivotPathKey([{ key: 'year', value: '2024' }]));
        expect(createPivotPathKey([{ key: 'value', value: null }])).not.toBe(createPivotPathKey([{ key: 'value', value: undefined }]));
        expect(createPivotPathKey([{ key: 'value', value: Number.NaN }])).not.toBe(createPivotPathKey([{ key: 'value', value: null }]));
        expect(createPivotPathKey([{ key: 'value', value: Number.NaN }])).toBe(createPivotPathKey([{ key: 'value', value: Number.NaN }]));
    });

    test('builds a sorted hierarchy and restores collapsed nodes from paths', () => {
        const westPath = [{ key: 'region', value: 'West' }] as const;
        const tree = buildNestTree(['region', 'city'], rows, [createPivotPathKey(westPath)], false);

        expect(tree.children.map((node) => node.value)).toEqual(['East', 'West']);
        expect(tree.children[0].children.map((node) => node.value)).toEqual(['Boston']);
        expect(tree.children[1]).toMatchObject({ value: 'West', height: 1, isCollapsed: true });
        expect(tree.children[1].children.map((node) => node.value)).toEqual(['San Francisco', 'Seattle']);
    });

    test('sorts the final dimension by an aggregate value', () => {
        const tree = buildNestTree(['region'], rows, [], false, { fid: 'sales_sum', type: 'descending' });
        expect(tree.children.map((node) => node.value)).toEqual(['West', 'East']);
    });

    test('groups repeated NaN values into one hierarchy node', () => {
        const tree = buildNestTree(
            ['score'],
            [
                { score: Number.NaN, sales_sum: 1 },
                { score: Number.NaN, sales_sum: 2 },
            ],
            [],
            false
        );

        expect(tree.children).toHaveLength(1);
        expect(Number.isNaN(tree.children[0].value)).toBe(true);
    });

    test('adds summary nodes at each non-leaf level', () => {
        const tree = buildNestTree(['region', 'city'], rows, [], true);

        expect(tree.children[0]).toMatchObject({ kind: 'summary', isCollapsed: true });
        const east = tree.children.find((node) => node.value === 'East');
        expect(east?.children[0]).toMatchObject({ kind: 'summary', isCollapsed: true });
    });

    test('maps row and column leaves to metric records', () => {
        const leftTree = buildNestTree(['region', 'city'], rows, [], false);
        const topTree = buildNestTree(['year'], rows, [], false);
        const matrix = buildMetricTableFromNestTree(leftTree, topTree, rows);

        expect(matrix).toHaveLength(3);
        expect(matrix[0].map((cell) => cell?.sales_sum)).toEqual([9, 11]);
        expect(matrix[1].map((cell) => cell?.sales_sum)).toEqual([12, undefined]);
        expect(matrix[2].map((cell) => cell?.sales_sum)).toEqual([18, undefined]);
    });

    test('visits NaN leaves and the siblings after them when building metrics', () => {
        const data = [
            { score: 1, sales_sum: 10 },
            { score: Number.NaN, sales_sum: 20 },
        ];
        const leftTree = buildNestTree(['score'], data, [], false);
        const topTree = buildNestTree([], data, [], false);
        const matrix = buildMetricTableFromNestTree(leftTree, topTree, data);

        expect(matrix).toHaveLength(2);
        expect(matrix.map((row) => row[0]?.sales_sum).sort()).toEqual([10, 20]);
    });

    test('does not confuse user field IDs or values with internal tree nodes', () => {
        const data = [
            { __total: 'first', category: '__pivot_root__', sales_sum: 10 },
            { __total: 'second', category: '__pivot_summary__', sales_sum: 20 },
        ];
        const leftTree = buildNestTree(['__total', 'category'], data, [], false);
        const topTree = buildNestTree([], data, [], false);
        const matrix = buildMetricTableFromNestTree(leftTree, topTree, data);

        expect(matrix).toHaveLength(2);
        expect(matrix.map((row) => row[0]?.sales_sum).sort()).toEqual([10, 20]);
    });

    test('iterates a value that matches the summary node key exactly once', () => {
        const data = [
            { category: '__pivot_summary__', sales_sum: 10 },
            { category: 'regular', sales_sum: 20 },
        ];
        const leftTree = buildNestTree(['category'], data, [], true);
        const topTree = buildNestTree([], data, [], false);
        const matrix = buildMetricTableFromNestTree(leftTree, topTree, data);

        expect(matrix).toHaveLength(3);
        expect(matrix.slice(1).map((row) => row[0]?.sales_sum).sort()).toEqual([10, 20]);
    });

    test('uses an exact subtotal record for a collapsed path', () => {
        const westPath = [{ key: 'region', value: 'West' }] as const;
        const leftTree = buildNestTree(['region', 'city'], rows, [createPivotPathKey(westPath)], false);
        const topTree = buildNestTree(['year'], rows, [], false);
        const matrix = buildMetricTableFromNestTree(leftTree, topTree, [...rows, { region: 'West', year: 2024, sales_sum: 30 }]);

        expect(matrix).toHaveLength(2);
        expect(matrix[1][0]?.sales_sum).toBe(30);
    });
});
