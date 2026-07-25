import type { IComputationFunction, IViewField } from '../../interfaces';
import type { PivotTableProps } from './public';

const fields: IViewField[] = [];
const computation: IComputationFunction = async () => [];

const localProps: PivotTableProps = { fields, rows: [], columns: [], data: [] };
const remoteProps: PivotTableProps = { fields, rows: [], columns: [], computation };

// @ts-expect-error A PivotTable data source must be local or external, never both.
const conflictingProps: PivotTableProps = { fields, rows: [], columns: [], data: [], computation };

// @ts-expect-error A PivotTable requires exactly one computation source.
const missingSourceProps: PivotTableProps = { fields, rows: [], columns: [] };

describe('PivotTable public prop contract', () => {
    test('accepts local and dispatched computation variants', () => {
        expect('data' in localProps).toBe(true);
        expect('computation' in remoteProps).toBe(true);
        expect(conflictingProps).toBeDefined();
        expect(missingSourceProps).toBeDefined();
    });
});
