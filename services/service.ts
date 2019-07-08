import { AxiosRequestConfig } from 'axios';
import { useEffect, useState } from 'react';

import { failure, loading, notAsked, RemoteData, RemoteDataResult, success } from '../libs/schema';
import { axiosInstance } from './instance';

export async function service<S = any, F = any>(config: AxiosRequestConfig): Promise<RemoteDataResult<S, F>> {
    try {
        const response = await axiosInstance(config);

        return success(response.data);
    } catch (err) {
        return failure(err.response ? err.response.data : err.message);
    }
}

export function effectService<S = any, F = any>(
    config: AxiosRequestConfig,
    deps: ReadonlyArray<any> = []
): [RemoteData<S, F>, () => void] {
    const [remoteData, setRemoteData] = useState<RemoteData<S, F>>(notAsked);

    // Use another state variable to trigger effect on demand
    const [reloadsCount, setReloadsCount] = useState(0);

    useEffect(() => {
        (async () => {
            setRemoteData(loading);
            const response: RemoteDataResult<S, F> = await service(config);
            setRemoteData(response);
        })();
    }, deps.concat(reloadsCount));

    return [remoteData, () => setReloadsCount((count) => count + 1)];
}
