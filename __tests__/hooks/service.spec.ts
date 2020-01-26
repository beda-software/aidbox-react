import { act, renderHook } from '@testing-library/react-hooks';
import { useService } from '../../hooks/service';
import { success } from '../../libs/remoteData';

describe('Hook `useService`', () => {
    const data = { custom: 'data' };
    const service = () => Promise.resolve(success(data));

    const remoteDataSuccess = {
        status: 'Success',
        data,
    };

    const remoteDataLoading = {
        status: 'Loading',
    };

    test('change `Loading` to `Success` status when service resolved', async () => {
        const deps = [1, 2];
        const { result, waitForNextUpdate } = renderHook(() => useService(service, deps));

        expect(result.current[0]).toEqual(remoteDataLoading);

        await waitForNextUpdate();

        expect(result.current[0]).toEqual(remoteDataSuccess);
    });

    test('method `reload` returns the same data ', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useService(service));

        await waitForNextUpdate();

        expect(result.current[0]).toEqual(remoteDataSuccess);

        act(() => {
            result.current[1].reload();
        });

        expect(result.current[0]).toEqual(remoteDataLoading);

        await waitForNextUpdate();

        expect(result.current[0]).toEqual(remoteDataSuccess);
    });

    test('has `set` data method returns success remote data', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useService(service));
        const data = { custom: 'data-new' };

        await waitForNextUpdate();

        act(() => {
            result.current[1].set(data);
        });

        expect(result.current[0]).toEqual({
            status: 'Success',
            data,
        });
    });
});
