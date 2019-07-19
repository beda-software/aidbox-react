import _ from 'lodash';

import { AidboxReference, AidboxResource, Bundle } from 'src/contrib/aidbox';

import { failure, RemoteDataResult } from '../libs/remoteData';
import { service } from './service';
import { SearchParams } from './search';

interface InactiveMappingItem {
    searchField: string;
    statusField: string;
    value: any;
}

interface InactiveMapping {
    [resourceType: string]: InactiveMappingItem;
}

const inactiveMapping: InactiveMapping = {
    DocumentReference: {
        searchField: 'status',
        statusField: 'status',
        value: 'entered-in-error',
    },
    Observation: {
        searchField: 'status',
        statusField: 'status',
        value: 'entered-in-error',
    },
    Location: {
        searchField: 'status',
        statusField: 'status',
        value: 'inactive',
    },
    Schedule: {
        searchField: 'active',
        statusField: 'active',
        value: false,
    },
    Slot: {
        searchField: 'status',
        statusField: 'status',
        value: 'entered-in-error',
    },
    Practitioner: {
        searchField: 'active',
        statusField: 'active',
        value: false,
    },
    Patient: {
        searchField: 'active',
        statusField: 'active',
        value: false,
    },
    User: {
        searchField: 'active',
        statusField: 'active',
        value: false,
    },
    Note: {
        searchField: 'status',
        statusField: 'status',
        value: 'entered-in-error',
    },
};

function getInactiveSearchParam(resourceType: string) {
    const item = inactiveMapping[resourceType];

    if (item) {
        return {
            [`${item.searchField}:not`]: [item.value],
        };
    }

    return {};
}

export async function getFHIRResource<R extends AidboxResource>(
    reference: AidboxReference<R>
): Promise<RemoteDataResult<R>> {
    return service({
        method: 'GET',
        url: `/${reference.resourceType}/${reference.id}`,
    });
}

export async function getFHIRResources<R extends AidboxResource>(
    resourceType: R['resourceType'],
    params: SearchParams
): Promise<RemoteDataResult<Bundle<R>>> {
    return service({
        method: 'GET',
        url: `/${resourceType}`,
        params: { ...params, ...getInactiveSearchParam(resourceType) },
    });
}

export async function saveFHIRResource<R extends AidboxResource>(resource: R): Promise<RemoteDataResult<R>> {
    return service({
        method: resource.id ? 'PUT' : 'POST',
        data: resource,
        url: `/${resource.resourceType}${resource.id ? '/' + resource.id : ''}`,
    });
}

export async function saveFHIRResources<R extends AidboxResource>(
    resources: R[],
    bundleType: 'transaction' | 'batch'
): Promise<RemoteDataResult<Bundle<R>>> {
    return service({
        method: 'POST',
        url: '/',
        data: {
            type: bundleType,
            entry: _.map(resources, (resource) => ({
                resource,
                request: {
                    method: resource.id ? 'PUT' : 'POST',
                    url: `/${resource.resourceType}${resource.id ? '/' + resource.id : ''}`,
                },
            })),
        },
    });
}

export async function deleteFHIRResource<R extends AidboxResource>(
    resource: AidboxReference<R>
): Promise<RemoteDataResult<R>> {
    const inactiveMappingItem = inactiveMapping[resource.resourceType];

    if (!inactiveMappingItem) {
        console.error(`Please specify inactiveMapping for ${resource.resourceType} to mark item deleted`);

        return failure({});
    }

    return service({
        method: 'PATCH',
        url: `/${resource.resourceType}/${resource.id}`,
        data: {
            [inactiveMappingItem.statusField]: inactiveMappingItem.value,
        },
    });
}

export function getReference<T extends AidboxResource>(resource: T, display?: string): AidboxReference<T> {
    return {
        resourceType: resource.resourceType,
        id: resource.id!,
        display,
    };
}

export function makeReference<T extends AidboxResource>(
    resourceType: string,
    id: string,
    display?: string
): AidboxReference<T> {
    return {
        resourceType,
        id,
        display,
    };
}

export type ResourcesMap<T extends AidboxResource> = { [P in T['resourceType']]: T[] | undefined };
export function extractBundleResources<T extends AidboxResource>(bundle: Bundle<T>): ResourcesMap<T> {
    const entriesByResourceType = _.groupBy(bundle.entry, (entry) => entry.resource!.resourceType);

    return _.mapValues(entriesByResourceType, (entries) => _.map(entries, (entry) => entry.resource!));
}
