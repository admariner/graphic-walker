import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { IViewField } from '../../interfaces';
import { buildPivotTable } from '../../workers/buildPivotTable';
import { PivotTableView } from './view';
import { createPivotPathKey } from './utils';

const dimension = (fid: string, name: string): IViewField => ({
    fid,
    name,
    analyticType: 'dimension',
    semanticType: 'nominal',
});

const measure: IViewField = {
    fid: 'sales',
    name: 'Sales',
    analyticType: 'measure',
    semanticType: 'quantitative',
    aggName: 'sum',
};

describe('PivotTableView', () => {
    test('renders headers, values, formatting, and accessible collapse controls', () => {
        const region = dimension('region', 'Region');
        const city = dimension('city', 'City');
        const year = dimension('year', 'Year');
        const result = buildPivotTable(
            [region, city],
            [year],
            [{ region: 'East', city: 'Boston', year: '2024', sales_sum: 1234.5 }],
            [],
            [],
            false
        );
        const markup = renderToStaticMarkup(
            <PivotTableView
                model={{ leftTree: result.lt, topTree: result.tt, metric: result.metric, isEmpty: false }}
                rows={[region, city]}
                columns={[year, measure]}
                numberFormat=",.1f"
                enableCollapse
                onHeaderCollapse={() => {}}
            />
        );

        expect(markup).toContain('data-testid="pivot-table-view"');
        expect(markup).toContain('Boston');
        expect(markup).toContain('sum(Sales)');
        expect(markup).toContain('1,234.5');
        expect(markup).toContain('aria-label="Collapse East"');
        expect(markup.match(/<table/g)).toHaveLength(1);
        expect(markup).toContain('scope="row"');
        expect(markup).toContain('scope="col"');
    });

    test('falls back to locale formatting when the number format is invalid', () => {
        const region = dimension('region', 'Region');
        const result = buildPivotTable([region], [], [{ region: 'East', sales_sum: 1234 }], [], [], false);
        const markup = renderToStaticMarkup(
            <PivotTableView
                model={{ leftTree: result.lt, topTree: result.tt, metric: result.metric, isEmpty: false }}
                rows={[region, measure]}
                columns={[]}
                numberFormat="not-a-d3-format"
                enableCollapse={false}
                onHeaderCollapse={() => {}}
            />
        );

        expect(markup).toContain('1,234');
    });

    test('renders raw measure keys and unaggregated headers when aggregation is disabled', () => {
        const region = dimension('region', 'Region');
        const result = buildPivotTable([region], [], [{ region: 'East', sales: 1234 }], [], [], false);
        const markup = renderToStaticMarkup(
            <PivotTableView
                model={{ leftTree: result.lt, topTree: result.tt, metric: result.metric, isEmpty: false }}
                rows={[region, measure]}
                columns={[]}
                defaultAggregated={false}
                numberFormat=",.0f"
                enableCollapse={false}
                onHeaderCollapse={() => {}}
            />
        );

        expect(markup).toContain('Sales');
        expect(markup).not.toContain('sum(Sales)');
        expect(markup).toContain('1,234');
        expect(markup).not.toContain('--');
    });

    test('keeps internal marker-like values collapsible', () => {
        const region = dimension('region', 'Region');
        const city = dimension('city', 'City');
        const result = buildPivotTable(
            [region, city],
            [],
            [{ region: '__total', city: 'Marker City', sales_sum: 7 }],
            [],
            [createPivotPathKey([{ key: 'region', value: '__total' }])],
            false
        );
        const markup = renderToStaticMarkup(
            <PivotTableView
                model={{ leftTree: result.lt, topTree: result.tt, metric: result.metric, isEmpty: false }}
                rows={[region, city, measure]}
                columns={[]}
                enableCollapse
                onHeaderCollapse={() => {}}
            />
        );

        expect(markup).toContain('aria-label="Expand __total"');
    });

    test('applies the requested display offset to nested temporal row fields', () => {
        const region = dimension('region', 'Region');
        const occurredAt: IViewField = {
            ...dimension('occurredAt', 'Occurred at'),
            semanticType: 'temporal',
            offset: 0,
        };
        const result = buildPivotTable(
            [region, occurredAt],
            [],
            [{ region: 'East', occurredAt: '2024-01-01T12:00:00Z', sales_sum: 7 }],
            [],
            [],
            false
        );
        const markup = renderToStaticMarkup(
            <PivotTableView
                model={{ leftTree: result.lt, topTree: result.tt, metric: result.metric, isEmpty: false }}
                rows={[region, occurredAt, measure]}
                columns={[]}
                timezoneDisplayOffset={123}
                enableCollapse={false}
                onHeaderCollapse={() => {}}
            />
        );

        expect(markup).toContain('2024-01-01 09:57:00');
    });

    test('renders temporal summary labels without parsing them as dates', () => {
        const occurredAt: IViewField = {
            ...dimension('occurredAt', 'Occurred at'),
            semanticType: 'temporal',
            offset: 0,
        };
        const completedAt: IViewField = {
            ...dimension('completedAt', 'Completed at'),
            semanticType: 'temporal',
            offset: 0,
        };
        const result = buildPivotTable(
            [occurredAt],
            [completedAt],
            [{ occurredAt: '2024-01-01T12:00:00Z', completedAt: '2024-01-02T12:00:00Z', sales_sum: 7 }],
            [],
            [],
            true
        );
        const markup = renderToStaticMarkup(
            <PivotTableView
                model={{ leftTree: result.lt, topTree: result.tt, metric: result.metric, isEmpty: false }}
                rows={[occurredAt]}
                columns={[completedAt, measure]}
                timezoneDisplayOffset={0}
                enableCollapse={false}
                onHeaderCollapse={() => {}}
            />
        );

        expect(markup).toContain('root(total)');
        expect(markup).not.toContain('NaN-NaN-NaN');
    });
});
