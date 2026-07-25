import type { IRow } from '../../interfaces';

export type PivotTableValue = string | number | boolean | null | undefined;

export interface IPivotTablePathItem {
    key: string;
    value: PivotTableValue;
}

export type IPivotTablePath = IPivotTablePathItem[];

export interface INestNode {
    kind: 'root' | 'value' | 'summary';
    key: PivotTableValue;
    value: PivotTableValue;
    sort: PivotTableValue;
    uniqueKey: string;
    fieldKey: string;
    children: INestNode[];
    height: number;
    isCollapsed: boolean;
    path: IPivotTablePath;
}

export interface IPivotTableModel {
    leftTree: INestNode;
    topTree: INestNode;
    metric: (IRow | null | undefined)[][];
    isEmpty: boolean;
}
