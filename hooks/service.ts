import { useEffect, useState } from 'react';

import { loading, notAsked, RemoteData, RemoteDataResult } from '../libs/remoteData';

export function useService<S = any, F = any>(
    asyncFunction: () => Promise<RemoteDataResult<S, F>>,
    deps: ReadonlyArray<any> = []
): [RemoteData<S, F>, () => void] {
    const [remoteData, setRemoteData] = useState<RemoteData<S, F>>(notAsked);

    // Use another state variable to trigger effect on demand
    const [reloadsCount, setReloadsCount] = useState(0);

    useEffect(() => {
        (async () => {
            setRemoteData(loading);
            const response: RemoteDataResult<S, F> = await asyncFunction();
            setRemoteData(response);
        })();
    }, deps.concat(reloadsCount));

    return [remoteData, () => setReloadsCount((count) => count + 1)];
}
