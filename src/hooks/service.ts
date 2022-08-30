import { useEffect, useState, useCallback, useMemo } from 'react';

import { loading, notAsked, RemoteData, RemoteDataResult, success, failure, isSuccess } from '../libs/remoteData';

export interface ServiceManager<S, F> {
    // `reload` just sends signal to reload
    reload: () => void;
    // `reloadAsync` returns Promise and intialize loading from the loading state
    reloadAsync: () => Promise<RemoteDataResult<S, F>>;
    // `softReloadAsync` returns Promise and intialize just updates
    // remoteData with success/failure state without preloading
    softReloadAsync: () => Promise<RemoteDataResult<S, F>>;
    set: (dataOrFn: S | ((data: S) => S)) => void;
}

export function useService<S = any, F = any>(
    asyncFunction: () => Promise<RemoteDataResult<S, F>>,
    deps: ReadonlyArray<any> = []
): [RemoteData<S, F>, ServiceManager<S, F>] {
    const [remoteData, setRemoteData] = useState<RemoteData<S, F>>(notAsked);
    const [reloadsCount, setReloadsCount] = useState(0);
    const reload = useCallback(() => setReloadsCount((x) => x + 1), []);

    const load = useCallback(async () => {
        try {
            return await asyncFunction();
        } catch (err: any) {
            return failure(err.response ? err.response.data : err.message);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    const softReloadAsync = useCallback(async () => {
        const response = await load();
        setRemoteData(response);

        return response;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, load]);

    const reloadAsync = useCallback(async () => {
        setRemoteData(loading);
        const response = await load();
        setRemoteData(response);

        return response;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, load]);

    useEffect(() => {
        (async () => {
            setRemoteData(loading);
            setRemoteData(await load());
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, reloadsCount, load]);

    const set = useCallback((dataOrFn: S | ((data: S) => S)) => {
        if (typeof dataOrFn === 'function') {
            setRemoteData((rd) => (isSuccess(rd) ? success((dataOrFn as (data: S) => S)(rd.data)) : rd));
        } else {
            setRemoteData(success(dataOrFn));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    const manager = useMemo(
        () => ({
            reload,
            reloadAsync,
            softReloadAsync,
            set,
        }),
        [reload, reloadAsync, softReloadAsync, set]
    );

    return [remoteData, manager];
}
