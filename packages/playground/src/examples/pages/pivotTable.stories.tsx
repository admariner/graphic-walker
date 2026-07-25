import { useContext, useEffect, useMemo, useState } from 'react';
import type { IComputationFunction, IPivotTablePath, IRenderStatus, IRow, IViewField } from '@kanaries/graphic-walker';
import { PivotTable } from '@kanaries/graphic-walker';
import { themeContext } from '../context';

const salesData: IRow[] = [
    { region: 'North', product: 'Notebook', year: '2024', sales: 18200 },
    { region: 'North', product: 'Notebook', year: '2025', sales: 21300 },
    { region: 'North', product: 'Phone', year: '2024', sales: 14700 },
    { region: 'North', product: 'Phone', year: '2025', sales: 16900 },
    { region: 'South', product: 'Notebook', year: '2024', sales: 13100 },
    { region: 'South', product: 'Notebook', year: '2025', sales: 15800 },
    { region: 'South', product: 'Phone', year: '2024', sales: 19600 },
    { region: 'South', product: 'Phone', year: '2025', sales: 22400 },
    { region: 'West', product: 'Notebook', year: '2024', sales: 16600 },
    { region: 'West', product: 'Notebook', year: '2025', sales: 20100 },
    { region: 'West', product: 'Phone', year: '2024', sales: 17300 },
    { region: 'West', product: 'Phone', year: '2025', sales: 23900 },
];

const fields: IViewField[] = [
    { fid: 'region', name: 'Region', semanticType: 'nominal', analyticType: 'dimension' },
    { fid: 'product', name: 'Product', semanticType: 'nominal', analyticType: 'dimension' },
    { fid: 'year', name: 'Year', semanticType: 'ordinal', analyticType: 'dimension' },
    { fid: 'sales', name: 'Sales', semanticType: 'quantitative', analyticType: 'measure', aggName: 'sum' },
];

const fieldById = new Map(fields.map((field) => [field.fid, field]));
const salesField = fieldById.get('sales')!;
const pivotTableStyle = { height: 420 } as const;

type Engine = 'local' | 'duckdb';
type Layout = 'region-product' | 'product-year';

const engineOptions: ReadonlyArray<{ id: Engine; label: string }> = [
    { id: 'local', label: 'Browser data' },
    { id: 'duckdb', label: 'DuckDB-WASM' },
];

const layoutOptions: ReadonlyArray<{ id: Layout; label: string }> = [
    { id: 'region-product', label: 'Region / Year × Product' },
    { id: 'product-year', label: 'Product / Region × Year' },
];

function getLayout(layout: Layout): { rows: IViewField[]; columns: IViewField[] } {
    if (layout === 'product-year') {
        return {
            rows: [fieldById.get('product')!, fieldById.get('region')!],
            columns: [fieldById.get('year')!, salesField],
        };
    }
    return {
        rows: [fieldById.get('region')!, fieldById.get('year')!],
        columns: [fieldById.get('product')!, salesField],
    };
}

export default function PivotTableExamples() {
    const { theme } = useContext(themeContext);
    const [engine, setEngine] = useState<Engine>('local');
    const [layout, setLayout] = useState<Layout>('region-product');
    const [duckDBComputation, setDuckDBComputation] = useState<IComputationFunction>();
    const [duckDBError, setDuckDBError] = useState<string>();
    const [renderError, setRenderError] = useState<string>();
    const [renderStatus, setRenderStatus] = useState<IRenderStatus>('idle');
    const [collapsedPaths, setCollapsedPaths] = useState<IPivotTablePath[]>([]);
    const { rows, columns } = useMemo(() => getLayout(layout), [layout]);

    useEffect(() => {
        if (engine !== 'duckdb') {
            setDuckDBComputation(undefined);
            setDuckDBError(undefined);
            return;
        }

        let active = true;
        let close: (() => Promise<void>) | undefined;
        setDuckDBComputation(undefined);
        setDuckDBError(undefined);

        void (async () => {
            try {
                const { getComputation: getDuckDBComputation, init: initDuckDB } = await import('@kanaries/duckdb-computation');
                await initDuckDB();
                const session = await getDuckDBComputation(salesData);
                if (!active) {
                    await session.close();
                    return;
                }
                close = session.close;
                setDuckDBComputation(() => session.computation);
            } catch (reason) {
                if (active) {
                    setDuckDBError(reason instanceof Error ? reason.message : String(reason));
                }
            }
        })();

        return () => {
            active = false;
            if (close) {
                void close();
            }
        };
    }, [engine]);

    const selectLayout = (nextLayout: Layout) => {
        setLayout(nextLayout);
        setCollapsedPaths([]);
        setRenderError(undefined);
    };

    const pivotTableProps = {
        fields,
        rows,
        columns,
        appearance: theme,
        showTableSummary: true,
        numberFormat: ',.0f',
        collapsedPaths,
        onCollapsedPathsChange: setCollapsedPaths,
        onRenderStatusChange: setRenderStatus,
        onError: (error: Error) => setRenderError(error.message),
        style: pivotTableStyle,
    } as const;

    return (
        <main className="flex min-h-[36rem] flex-col gap-4 bg-white p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <section aria-labelledby="engine-heading">
                <h2 id="engine-heading" className="mb-2 text-sm font-semibold">
                    Computation mode
                </h2>
                <div className="flex flex-wrap gap-2">
                    {engineOptions.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            aria-pressed={engine === option.id}
                            className={`rounded border px-3 py-2 text-sm ${engine === option.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : ''}`}
                            onClick={() => setEngine(option.id)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </section>

            <section aria-labelledby="layout-heading">
                <h2 id="layout-heading" className="mb-2 text-sm font-semibold">
                    Host-controlled field layout
                </h2>
                <div className="flex flex-wrap gap-2">
                    {layoutOptions.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            aria-pressed={layout === option.id}
                            className={`rounded border px-3 py-2 text-sm ${layout === option.id ? 'bg-blue-600 text-white' : ''}`}
                            onClick={() => selectLayout(option.id)}
                        >
                            {option.label}
                        </button>
                    ))}
                    <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setCollapsedPaths([])}>
                        Expand all
                    </button>
                </div>
            </section>

            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
                Engine: {engine === 'local' ? 'built-in browser computation' : 'dispatched DuckDB-WASM computation'} · Status: {renderStatus}
            </p>

            {duckDBError && <p role="alert">DuckDB initialization failed: {duckDBError}</p>}
            {renderError && <p role="alert">PivotTable failed: {renderError}</p>}
            {engine === 'local' ? (
                <PivotTable data={salesData} {...pivotTableProps} />
            ) : duckDBComputation ? (
                <PivotTable computation={duckDBComputation} {...pivotTableProps} />
            ) : duckDBError ? null : (
                <p>Starting DuckDB-WASM…</p>
            )}
        </main>
    );
}
