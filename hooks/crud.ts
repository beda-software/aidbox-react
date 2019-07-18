import { useEffect, useState } from 'react';

import { AidboxResource } from 'src/contrib/aidbox';
import { isFailure, isSuccess, loading, notAsked, RemoteData, success } from '../libs/remoteData';
import {
    deleteFHIRResource,
    extractBundleResources,
    getFHIRResource,
    getReference,
    makeReference,
    saveFHIRResource,
    saveFHIRResources,
} from '../services/fhir';

export interface CRUDManager<T> {
    handleSave: (updatedResource: T) => void;
    handleDelete: (resourceToDelete: T) => void;
}

export function useCRUD<T extends AidboxResource>(
    resourceType: T['resourceType'],
    id?: string,
    getOrCreate?: boolean,
    defaultResource?: Partial<T>
): [RemoteData<T>, CRUDManager<T>] {
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
                const response = await getFHIRResource<T>(makeReference(resourceType, id));
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
            handleSave: async (updatedResource: T, relatedResources?: AidboxResource[]) => {
                setRemoteData(loading);
                if (relatedResources && relatedResources.length) {
                    const bundleResponse = await saveFHIRResources(
                        [updatedResource, ...relatedResources],
                        'transaction'
                    );
                    if (isSuccess(bundleResponse)) {
                        setRemoteData(extractBundleResources(bundleResponse.data)[resourceType][0]);
                    } else {
                        setRemoteData(bundleResponse);
                    }
                } else {
                    setRemoteData(await saveFHIRResource(updatedResource));
                }
            },
            handleDelete: async (resourceToDelete: T) => {
                setRemoteData(loading);
                setRemoteData(await deleteFHIRResource(getReference(resourceToDelete)));
            },
        },
    ];
}
