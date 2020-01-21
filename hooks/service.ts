import { useEffect, useState } from 'react';

import { loading, notAsked, RemoteData, RemoteDataResult, success } from '../libs/remoteData';

interface ServiceManager<S> {
    reload: () => void;
    set: (data: S) => void;
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
            const response: RemoteDataResult<S, F> = await asyncFunction();
            setRemoteData(response);
        })();
        // eslint-disable-next-line
    }, deps.concat(reloadsCount));

    return [
        remoteData,
        { reload: () => setReloadsCount((count) => count + 1), set: (data: S) => setRemoteData(success(data)) },
    ];
}
