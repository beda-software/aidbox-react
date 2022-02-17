import { useEffect, useState, useCallback } from 'react';

import { loading, notAsked, RemoteData, RemoteDataResult, success, failure, isSuccess } from '../libs/remoteData';

export interface ServiceManager<S, F> {
    reload: () => Promise<RemoteDataResult<S, F>>;
    softReload: () => Promise<RemoteDataResult<S, F>>;
    set: (dataOrFn: S | ((data: S) => S)) => void;
}

export function useService<S = any, F = any>(
    asyncFunction: () => Promise<RemoteDataResult<S, F>>,
    deps: ReadonlyArray<any> = []
): [RemoteData<S, F>, ServiceManager<S, F>] {
    const [remoteData, setRemoteData] = useState<RemoteData<S, F>>(notAsked);

    const load = useCallback(async () => {
        try {
            return await asyncFunction();
        } catch (err: any) {
            return failure(err.response ? err.response.data : err.message);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    const softReload = useCallback(async () => {
        const response = await load();
        setRemoteData(response);

        return response;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, load]);

    const reload = useCallback(async () => {
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
    }, [...deps, load]);

    return [
        remoteData,
        {
            reload,
            softReload,
            set: (dataOrFn: S | ((data: S) => S)) => {
                if (typeof dataOrFn === 'function') {
                    setRemoteData((rd) => (isSuccess(rd) ? success((dataOrFn as (data: S) => S)(rd.data)) : rd));
                } else {
                    setRemoteData(success(dataOrFn));
                }
            },
        },
    ];
}
