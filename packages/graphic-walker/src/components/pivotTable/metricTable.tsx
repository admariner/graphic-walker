import React from 'react';
import { useMemo } from 'react';
import { IField, IRow } from '../../interfaces';
import { getMeaAggKey } from '../../utils';
import { format } from 'd3-format';

export interface MetricTableProps {
    matrix: (IRow | null | undefined)[][];
    rowHeaders: React.ReactNode[][];
    meaInRows: IField[];
    meaInColumns: IField[];
    defaultAggregated: boolean;
    numberFormat: string;
}

function getCellData(cell: IRow, measure: IField, defaultAggregated: boolean, formatter: (value: unknown) => string) {
    const meaKey = defaultAggregated ? getMeaAggKey(measure.fid, measure.aggName) : measure.fid;
    if (cell[meaKey] === undefined) {
        return '--';
    }
    const formattedValue = formatter(cell[meaKey]);
    return formattedValue;
}

const MetricTable: React.FC<MetricTableProps> = React.memo(
    (props) => {
        const { matrix, rowHeaders, meaInRows, meaInColumns, defaultAggregated, numberFormat } = props;

        const numberFormatter = useMemo<(value: unknown) => string>(() => {
            let numberFormatter: (value: number) => string;
            try {
                numberFormatter = numberFormat ? format(numberFormat) : (value: number) => value.toLocaleString();
            } catch {
                numberFormatter = (value: number) => value.toLocaleString();
            }
            return (value: unknown) => {
                if (typeof value !== 'number') {
                    return `${value}`;
                }
                return numberFormatter(value);
            };
        }, [numberFormat]);

        return (
            <tbody className="bg-background text-foreground border-r border-b">
                {matrix.map((row, rIndex) => {
                    if (meaInRows.length !== 0) {
                        return meaInRows.map((rowMea, rmIndex) => {
                            return (
                                <tr className="divide-x divide-border" key={`${rIndex}-${rowMea.fid}-${rowMea.aggName}`}>
                                    {rowHeaders[rIndex * meaInRows.length + rmIndex]}
                                    {row.flatMap((cell, cIndex) => {
                                        const record = cell ?? {};
                                        if (meaInColumns.length !== 0) {
                                            return meaInColumns.map((colMea, cmIndex) => (
                                                <td
                                                    className="whitespace-nowrap p-2 text-xs"
                                                    key={`${rIndex}-${cIndex}-${rowMea.fid}-${rowMea.aggName}-${colMea.fid}-${colMea.aggName}`}
                                                >
                                                    {getCellData(record, rowMea, defaultAggregated, numberFormatter)} ,{' '}
                                                    {getCellData(record, colMea, defaultAggregated, numberFormatter)}
                                                </td>
                                            ));
                                        }
                                        return (
                                            <td className="whitespace-nowrap p-2 text-xs" key={`${rIndex}-${cIndex}-${rowMea.fid}-${rowMea.aggName}`}>
                                                {getCellData(record, rowMea, defaultAggregated, numberFormatter)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        });
                    }
                    return (
                        <tr className="divide-x divide-border" key={rIndex}>
                            {rowHeaders[rIndex]}
                            {row.flatMap((cell, cIndex) => {
                                const record = cell ?? {};
                                if (meaInRows.length === 0 && meaInColumns.length !== 0) {
                                    return meaInColumns.map((colMea, cmIndex) => (
                                        <td className="whitespace-nowrap p-2 text-xs" key={`${rIndex}-${cIndex}-${cmIndex}-${colMea.fid}-${colMea.aggName}`}>
                                            {getCellData(record, colMea, defaultAggregated, numberFormatter)}
                                        </td>
                                    ));
                                } else if (meaInRows.length === 0 && meaInColumns.length === 0) {
                                    return (
                                        <td className="whitespace-nowrap p-2 text-xs" key={`${rIndex}-${cIndex}`}>
                                            {`True`}
                                        </td>
                                    );
                                }
                                return null;
                            })}
                        </tr>
                    );
                })}
            </tbody>
        );
    }
);

export default MetricTable;
