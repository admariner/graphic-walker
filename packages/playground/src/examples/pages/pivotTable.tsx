import Example from '../components/examplePage';
import code from './pivotTable.stories?raw';
import PivotTableExamples from './pivotTable.stories';

const exampleStyle = { height: 'auto', minHeight: '80vh' } as const;

export default function PivotTableExamplePage() {
    return (
        <Example
            name="Standalone PivotTable"
            desc="Use local browser data or dispatch the same PivotTable workflow to DuckDB-WASM, while keeping rows, columns, and collapse state controlled by the host app."
            code={code}
            style={exampleStyle}
        >
            <PivotTableExamples />
        </Example>
    );
}
