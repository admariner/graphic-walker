import type { IComputationFunction, IDataQueryWorkflowStep, IRow, IViewWorkflowStep } from '../interfaces';

export async function dataQuery(service: IComputationFunction, workflow: IDataQueryWorkflowStep[], limit?: number): Promise<IRow[]> {
    const viewWorkflow = workflow.find((step) => step.type === 'view') as IViewWorkflowStep | undefined;
    if (viewWorkflow?.query.length === 1 && viewWorkflow.query[0].op === 'raw' && viewWorkflow.query[0].fields.length === 0) {
        return [];
    }
    return service({
        workflow,
        limit,
    });
}
