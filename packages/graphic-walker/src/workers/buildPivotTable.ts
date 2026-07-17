import { INestNode } from '../components/pivotTable/interface';
import { buildMetricTableFromNestTree, buildNestTree, createPivotPathKey, pivotTableValuesEqual } from '../components/pivotTable/utils';
import { IViewField, IRow } from '../interfaces';

const getFirstVisibleValuePath = (item: INestNode): INestNode[] => {
    const child = item.children.find((node) => node.kind === 'value');
    if (child) {
        return child.isCollapsed ? [child] : [child, ...getFirstVisibleValuePath(child)];
    }
    return [];
};

function getVisibleSlice(
    data: IRow[],
    visiblePrimaryData: IRow[],
    primaryDimensions: IViewField[],
    oppositeDimensions: IViewField[],
    oppositePath: INestNode[]
): IRow[] {
    const visibleDimensions = oppositeDimensions.slice(0, oppositePath.length);
    const hiddenDimensions = oppositeDimensions.slice(oppositePath.length);
    const visiblePrimaryKeys = new Set(
        visiblePrimaryData
            .filter((row) => primaryDimensions.every((field) => Object.prototype.hasOwnProperty.call(row, field.fid)))
            .map((row) => createPivotPathKey(primaryDimensions.map((field) => ({ key: field.fid, value: row[field.fid] }))))
    );
    return data.filter(
        (row) =>
            primaryDimensions.every((field) => Object.prototype.hasOwnProperty.call(row, field.fid)) &&
            visiblePrimaryKeys.has(createPivotPathKey(primaryDimensions.map((field) => ({ key: field.fid, value: row[field.fid] })))) &&
            visibleDimensions.every(
                (field, index) =>
                    Object.prototype.hasOwnProperty.call(row, field.fid) && pivotTableValuesEqual(row[field.fid], oppositePath[index].value)
            ) &&
            hiddenDimensions.every((field) => !Object.prototype.hasOwnProperty.call(row, field.fid))
    );
}

export function buildPivotTable(
    dimsInRow: IViewField[],
    dimsInColumn: IViewField[],
    allData: IRow[],
    aggData: IRow[],
    collapsedKeyList: string[],
    showTableSummary: boolean,
    sort?: {
        fid: string;
        type: 'ascending' | 'descending';
        mode: 'row' | 'column';
    }
): { lt: INestNode; tt: INestNode; metric: (IRow | null | undefined)[][] } {
    let lt: INestNode;
    let tt: INestNode;
    if (sort?.mode === 'row') {
        tt = buildNestTree(
            dimsInColumn.map((d) => d.fid),
            allData,
            collapsedKeyList,
            showTableSummary
        );
        const firstColumnPath = getFirstVisibleValuePath(tt);
        if (dimsInColumn.length > 0 && firstColumnPath.length > 0) {
            const mentioned = getVisibleSlice([...allData, ...aggData], allData, dimsInRow, dimsInColumn, firstColumnPath);
            const mentionedSet = new Set(mentioned);
            const rest = allData.filter((row) => !mentionedSet.has(row));
            lt = buildNestTree(
                dimsInRow.map((d) => d.fid),
                mentioned,
                collapsedKeyList,
                showTableSummary,
                sort,
                rest
            );
        } else {
            lt = buildNestTree(
                dimsInRow.map((d) => d.fid),
                allData,
                collapsedKeyList,
                showTableSummary,
                sort
            );
        }
    } else {
        lt = buildNestTree(
            dimsInRow.map((d) => d.fid),
            allData,
            collapsedKeyList,
            showTableSummary
        );
        const firstRowPath = getFirstVisibleValuePath(lt);
        if (sort && dimsInRow.length > 0 && firstRowPath.length > 0) {
            const mentioned = getVisibleSlice([...allData, ...aggData], allData, dimsInColumn, dimsInRow, firstRowPath);
            const mentionedSet = new Set(mentioned);
            const rest = allData.filter((row) => !mentionedSet.has(row));
            tt = buildNestTree(
                dimsInColumn.map((d) => d.fid),
                mentioned,
                collapsedKeyList,
                showTableSummary,
                sort,
                rest
            );
        } else {
            tt = buildNestTree(
                dimsInColumn.map((d) => d.fid),
                allData,
                collapsedKeyList,
                showTableSummary,
                sort
            );
        }
    }

    const metric = buildMetricTableFromNestTree(lt, tt, [...allData, ...aggData]);
    return { lt, tt, metric };
}
