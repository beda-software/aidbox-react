import { act, renderHook } from '@testing-library/react-hooks';
import { useService } from '../../hooks/service';
import { success, loading } from '../../libs/remoteData';

describe('Hook `useService`', () => {
    const data = { custom: 'data' };
    const dataSuccess = success(data);
    const service = () => Promise.resolve(dataSuccess);

    test('change `Loading` to `Success` status when service resolved', async () => {
        const deps = [1, 2];
        const { result, waitForNextUpdate } = renderHook(() => useService(service, deps));

        expect(result.current[0]).toEqual(loading);

        await waitForNextUpdate();

        expect(result.current[0]).toEqual(dataSuccess);
    });

    test('method `reload` returns the same data ', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useService(service));

        await waitForNextUpdate();

        expect(result.current[0]).toEqual(dataSuccess);

        act(() => {
            result.current[1].reload();
        });

        expect(result.current[0]).toEqual(loading);

        await waitForNextUpdate();

        expect(result.current[0]).toEqual(dataSuccess);
    });

    test('has `set` data method returns success remote data', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useService(service));
        const data = { custom: 'data-new' };

        await waitForNextUpdate();

        act(() => {
            result.current[1].set(data);
        });

        expect(result.current[0]).toEqual(success(data));
    });
});
