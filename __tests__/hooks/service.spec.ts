import { act, renderHook } from '@testing-library/react-hooks';
import { useService } from '../../hooks/service';
import { success, loading } from '../../libs/remoteData';

describe('Hook `useService`', () => {
    const data = { custom: 'data' };
    const dataSuccess = success(data);
    const service = () => Promise.resolve(dataSuccess);

    test('change `Loading` to `Success` status when service resolved', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useService(service));
        const {
            current: [firstRemoteData],
        } = result;

        expect(firstRemoteData).toEqual(loading);

        await waitForNextUpdate();

        const {
            current: [secondRemoteData],
        } = result;

        expect(secondRemoteData).toEqual(dataSuccess);
    });

    test('method `reload` returns the same data ', async () => {
        const deps = [1, 2];
        const { result, waitForNextUpdate } = renderHook(() => useService(service, deps));

        await waitForNextUpdate();

        const {
            current: [firstRemoteData, { reload }],
        } = result;

        expect(firstRemoteData).toEqual(dataSuccess);

        act(() => {
            reload();
        });

        const {
            current: [secondRemoteData],
        } = result;

        expect(secondRemoteData).toEqual(loading);

        await waitForNextUpdate();

        const {
            current: [thirdRemoteData],
        } = result;

        expect(thirdRemoteData).toEqual(dataSuccess);
    });

    test('has `set` data method returns success remote data', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useService(service));
        const data = { custom: 'data-new' };

        await waitForNextUpdate();

        const {
            current: [, { set }],
        } = result;

        act(() => {
            set(data);
        });

        const {
            current: [remoteData],
        } = result;

        expect(remoteData).toEqual(success(data));
    });
});
