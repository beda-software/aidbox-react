import { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import { useEffect, useState } from 'react';

import { AidboxResource, Bundle } from 'src/contrib/aidbox';

import {
    failure,
    isFailure,
    isSuccess,
    loading,
    notAsked,
    RemoteData,
    RemoteDataResult,
    success,
} from '../libs/remoteData';
import {
    deleteFHIRResourceAsync,
    extractBundleResources,
    getFHIRResourceAsync,
    getFHIRResources,
    getReference,
    makeReference,
    saveFHIRResourceAsync,
    saveFHIRResourcesAsync,
    SearchParams,
} from './fhir';
import { axiosInstance } from './instance';

export async function service<S = any, F = any>(config: AxiosRequestConfig): Promise<RemoteDataResult<S, F>> {
    try {
        const response = await axiosInstance(config);

        return success(response.data);
    } catch (err) {
        return failure(err.response ? err.response.data : err.message);
    }
}

export function effectAdapter<S = any, F = any>(
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

export function effectService<S = any, F = any>(
    config: AxiosRequestConfig,
    deps: ReadonlyArray<any> = []
): [RemoteData<S, F>, () => void] {
    return effectAdapter(async () => service(config), deps);
}

export interface PagerControlls {
    loadNext: () => void,
    hasNext: boolean,
    reload: () => void,
}

export function effectPager<T extends AidboxResource>(
    resourceType: T['resourceType'],
    resourcesOnPage: number = 15,
    searchParams: SearchParams = {}
): [RemoteData<Bundle<T>>, PagerControlls] {
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
            reload: () => setPageToLoad(1),
        },
    ];
}

export function effectCRUD<T extends AidboxResource>(
    resourceType: T['resourceType'],
    id?: string,
    getOrCreate?: boolean,
    defaultResource?: Partial<T>
): [
    RemoteData<T>,
    {
        onSave: (updatedResource: T) => void;
        onDelete: (resourceToDelete: T) => void;
    }
] {
    const [remoteData, setRemoteData] = useState<RemoteData<T>>(notAsked);

    const makeDefaultResource = () => ({
        resourceType,
        ...(id && getOrCreate ? { id } : {}),
        ...defaultResource,
    });

    useEffect(() => {
        (async () => {
            if (id) {
                setRemoteData(loading);
                const response = await getFHIRResourceAsync<T>(makeReference(resourceType, id));
                if (isFailure(response) && getOrCreate) {
                    setRemoteData(success(makeDefaultResource() as T));
                } else {
                    setRemoteData(response);
                }
            } else {
                setRemoteData(success(makeDefaultResource() as T));
            }
        })();
    }, []);

    return [
        remoteData,
        {
            onSave: async (updatedResource: T, relatedResources?: AidboxResource[]) => {
                setRemoteData(loading);
                if (relatedResources && relatedResources.length) {
                    const bundleResponse = await saveFHIRResourcesAsync(
                        [updatedResource, ...relatedResources],
                        'transaction'
                    );
                    if (isSuccess(bundleResponse)) {
                        setRemoteData(extractBundleResources(bundleResponse.data)[resourceType][0]);
                    } else {
                        setRemoteData(bundleResponse);
                    }
                } else {
                    setRemoteData(await saveFHIRResourceAsync(updatedResource));
                }
            },
            onDelete: async (resourceToDelete: T) => {
                setRemoteData(loading);
                setRemoteData(await deleteFHIRResourceAsync(getReference(resourceToDelete)));
            },
        },
    ];
}
