interface TerminableWorker {
    terminate(): void;
}

interface TerminableResource {
    terminate(): Promise<void>;
}

export async function initializeResourceWithCleanup<W extends TerminableWorker, R extends TerminableResource>(options: {
    objectUrl: string;
    createWorker: () => W;
    createResource: (worker: W) => R;
    initialize: (resource: R) => Promise<void>;
    revokeObjectUrl: (url: string) => void;
}): Promise<R> {
    let worker: W | undefined;
    let resource: R | undefined;
    try {
        worker = options.createWorker();
        resource = options.createResource(worker);
        await options.initialize(resource);
        return resource;
    } catch (error) {
        if (resource) {
            try {
                await resource.terminate();
            } catch {
                // Preserve the initialization error; cleanup is best effort.
            }
        } else {
            try {
                worker?.terminate();
            } catch {
                // Preserve the initialization error; cleanup is best effort.
            }
        }
        throw error;
    } finally {
        options.revokeObjectUrl(options.objectUrl);
    }
}
