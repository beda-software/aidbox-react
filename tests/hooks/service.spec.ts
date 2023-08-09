import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { useService } from '../../src/hooks/service';
import { success, loading, RemoteDataResult } from '../../src/libs/remoteData';

describe('Hook `useService`', () => {
    const data = { custom: 'data' };
    const dataSuccess = success(data);
    const service = () => Promise.resolve(dataSuccess);

    test('change `Loading` to `Success` status when service resolved', async () => {
        const spyEffect = jest.spyOn(React, 'useEffect');
        const { result, waitForNextUpdate } = renderHook(() => useService(service));
        const {
            current: [firstRemoteData],
        } = result;

        expect(spyEffect).toHaveBeenLastCalledWith(expect.anything(), [0, expect.anything()]);
        expect(firstRemoteData).toEqual(loading);

        await waitForNextUpdate();

        const {
            current: [secondRemoteData],
        } = result;

        expect(spyEffect).toHaveBeenLastCalledWith(expect.anything(), [0, expect.anything()]);
        expect(secondRemoteData).toEqual(dataSuccess);
    });

    test('method `reload` returns the same data ', async () => {
        const spyEffect = jest.spyOn(React, 'useEffect');
        const deps = [1, 2];
        const { result, waitForNextUpdate } = renderHook(() => useService(service, deps));

        await waitForNextUpdate();

        const {
            current: [firstRemoteData, { reload }],
        } = result;

        expect(spyEffect).toHaveBeenLastCalledWith(expect.anything(), [1, 2, 0, expect.anything()]);
        expect(firstRemoteData).toEqual(dataSuccess);

        act(() => {
            reload();
        });

        const {
            current: [secondRemoteData],
        } = result;

        expect(spyEffect).toHaveBeenLastCalledWith(expect.anything(), [1, 2, 1, expect.anything()]);
        expect(secondRemoteData).toEqual(loading);

        await waitForNextUpdate();

        const {
            current: [thirdRemoteData],
        } = result;

        expect(thirdRemoteData).toEqual(dataSuccess);
    });

    test('has `set` data method returns success remote data', async () => {
        const spyEffect = jest.spyOn(React, 'useEffect');
        const deps = [1, 2];
        const { result, waitForNextUpdate } = renderHook(() => useService(service, deps));
        const data = { custom: 'data-new' };

        await waitForNextUpdate();
        expect(spyEffect).toHaveBeenLastCalledWith(expect.anything(), [1, 2, 0, expect.anything()]);
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
        expect(spyEffect).toHaveBeenLastCalledWith(expect.anything(), [1, 2, 0, expect.anything()]);
    });

    test('changing dependencies while loading does not save early requests', async () => {
        // NOTE: sleepService fetched with delay 100 should be the last result
        // NOTE: even if first sleepService with delay 500 is resolved
        const sleepService = jest.fn(
            (delay: number) =>
                new Promise<RemoteDataResult>((resolve) => setTimeout(() => resolve(success({ delay })), delay))
        );
        const { result, rerender } = renderHook((delay) => useService(() => sleepService(delay), [delay]), {
            initialProps: 500,
        });

        // Invoke for the second time with a shorter delay
        rerender(100);

        const firstPromise = sleepService.mock.results[0].value;
        const secondPromise = sleepService.mock.results[1].value;

        await firstPromise;
        await secondPromise;

        expect(result.current[0]).toEqual(success({ delay: 100 }));
    });
});
