import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { useService } from '../../src/hooks/service';
import { success, loading } from '../../src/libs/remoteData';

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
});
