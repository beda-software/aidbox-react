import { useEffect, useState } from 'react';

import { loading, notAsked, RemoteData, RemoteDataResult, success, failure, isSuccess } from '../libs/remoteData';

export interface ServiceManager<S> {
    reload: () => void;
    set: (dataOrFn: S | ((data: S) => S)) => void;
}

export function useService<S = any, F = any>(
    asyncFunction: () => Promise<RemoteDataResult<S, F>>,
    deps: ReadonlyArray<any> = []
): [RemoteData<S, F>, ServiceManager<S>] {
    const [remoteData, setRemoteData] = useState<RemoteData<S, F>>(notAsked);

    // Use another state variable to trigger effect on demand
    const [reloadsCount, setReloadsCount] = useState(0);

    useEffect(() => {
        (async () => {
            setRemoteData(loading);
            try {
                const response: RemoteDataResult<S, F> = await asyncFunction();
                setRemoteData(response);
            } catch (err: any) {
                setRemoteData(failure(err.response ? err.response.data : err.message));
            }
        })();
        // eslint-disable-next-line
    }, deps.concat(reloadsCount));

    return [
        remoteData,
        {
            reload: () => setReloadsCount((count) => count + 1),
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
