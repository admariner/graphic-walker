import { currentMediaTheme } from './media';

describe('currentMediaTheme', () => {
    test('uses a stable light fallback outside a browser', () => {
        expect(currentMediaTheme()).toBe('light');
    });
});
