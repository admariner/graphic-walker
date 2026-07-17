import React, { useMemo } from 'react';
import type { IViewField } from '../../interfaces';
import { buildLeftTreeRows } from './leftTree';
import MetricTable from './metricTable';
import TopTree from './topTree';
import type { INestNode, IPivotTableModel } from './interface';
import { getPivotTableFields } from './query';

export interface PivotTableViewProps {
    model: IPivotTableModel;
    rows: readonly IViewField[];
    columns: readonly IViewField[];
    defaultAggregated?: boolean;
    numberFormat?: string;
    timezoneDisplayOffset?: number;
    enableCollapse: boolean;
    onHeaderCollapse: (node: INestNode) => void;
}

export const PivotTableView: React.FC<PivotTableViewProps> = ({
    model,
    rows,
    columns,
    defaultAggregated = true,
    numberFormat = '',
    timezoneDisplayOffset,
    enableCollapse,
    onHeaderCollapse,
}) => {
    const { dimsInRow, dimsInColumn, measInRow, measInColumn } = useMemo(() => getPivotTableFields(rows, columns), [rows, columns]);
    const rowHeaders = useMemo(
        () =>
            buildLeftTreeRows({
                data: model.leftTree,
                dimsInRow,
                measInRow,
                onHeaderCollapse,
                enableCollapse,
                defaultAggregated,
                displayOffset: timezoneDisplayOffset,
            }),
        [model.leftTree, dimsInRow, measInRow, onHeaderCollapse, enableCollapse, defaultAggregated, timezoneDisplayOffset]
    );

    return (
        <div className="min-w-max" data-testid="pivot-table-view">
            <table className="border border-collapse">
                <TopTree
                    data={model.topTree}
                    dimsInCol={dimsInColumn}
                    measInCol={measInColumn}
                    dimsInRow={dimsInRow}
                    measInRow={measInRow}
                    onHeaderCollapse={onHeaderCollapse}
                    enableCollapse={enableCollapse}
                    defaultAggregated={defaultAggregated}
                    displayOffset={timezoneDisplayOffset}
                />
                <MetricTable
                    matrix={model.metric}
                    rowHeaders={rowHeaders}
                    meaInColumns={measInColumn}
                    meaInRows={measInRow}
                    defaultAggregated={defaultAggregated}
                    numberFormat={numberFormat}
                />
            </table>
        </div>
    );
};
