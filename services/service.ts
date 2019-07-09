import { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import { useEffect, useState } from 'react';

import { AidboxResource, Bundle } from 'src/contrib/aidbox';

import { failure, isSuccess, loading, notAsked, RemoteData, RemoteDataResult, success } from '../libs/remoteData';
import { getFHIRResources, SearchParams } from './fhir';
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

export function effectPager<T extends AidboxResource>(
    resourceType: T['resourceType'],
    resourcesOnPage: number = 15,
    searchParams: SearchParams = {}
): [RemoteData<Bundle<T>>, { loadNext: () => void; hasNext: boolean }] {
    const [pageToLoad, setPageToLoad] = useState(1);

    const [resources] = getFHIRResources(
        resourceType,
        {
            ...searchParams,
            _count: resourcesOnPage,
            _page: pageToLoad,
        },
        [pageToLoad]
    );

    return [
        resources,
        {
            loadNext: () => setPageToLoad((currentPage) => currentPage + 1),
            hasNext: isSuccess(resources) && !!_.find(resources.data.link, { relation: 'next' }),
        },
    ];
}
