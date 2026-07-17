import { initializeResourceWithCleanup } from '../src/lifecycle';

describe('initializeResourceWithCleanup', () => {
    test('revokes the object URL and terminates a failed resource', async () => {
        const worker = { terminate: jest.fn() };
        const resource = { terminate: jest.fn(async () => {}) };
        const revokeObjectUrl = jest.fn();

        await expect(
            initializeResourceWithCleanup({
                objectUrl: 'blob:duckdb',
                createWorker: () => worker,
                createResource: () => resource,
                initialize: async () => {
                    throw new Error('instantiate failed');
                },
                revokeObjectUrl,
            })
        ).rejects.toThrow('instantiate failed');

        expect(resource.terminate).toHaveBeenCalledTimes(1);
        expect(worker.terminate).not.toHaveBeenCalled();
        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:duckdb');
    });

    test('terminates the worker if resource construction fails and permits a clean retry', async () => {
        const firstWorker = { terminate: jest.fn() };
        const secondWorker = { terminate: jest.fn() };
        const resource = { terminate: jest.fn(async () => {}) };
        const revokeObjectUrl = jest.fn();

        await expect(
            initializeResourceWithCleanup({
                objectUrl: 'blob:first',
                createWorker: () => firstWorker,
                createResource: () => {
                    throw new Error('constructor failed');
                },
                initialize: async () => {},
                revokeObjectUrl,
            })
        ).rejects.toThrow('constructor failed');

        await expect(
            initializeResourceWithCleanup({
                objectUrl: 'blob:second',
                createWorker: () => secondWorker,
                createResource: () => resource,
                initialize: async () => {},
                revokeObjectUrl,
            })
        ).resolves.toBe(resource);

        expect(firstWorker.terminate).toHaveBeenCalledTimes(1);
        expect(secondWorker.terminate).not.toHaveBeenCalled();
        expect(resource.terminate).not.toHaveBeenCalled();
        expect(revokeObjectUrl).toHaveBeenCalledTimes(2);
    });
});
