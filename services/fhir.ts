import _ from 'lodash';

import { AidboxReference, AidboxResource, Bundle } from 'src/contrib/aidbox';

import { failure } from '../libs/remoteData';
import { effectAdapter, effectService, service } from './service';

export type SearchParam<T> = T | T[] | undefined;

export interface SearchParams {
    [key: string]: SearchParam<string | number | boolean>;
}

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

export async function getFHIRResourceAsync<R extends AidboxResource>(reference: AidboxReference<R>) {
    return service({
        method: 'GET',
        url: `/${reference.resourceType}/${reference.id}`,
    });
}

export function getFHIRResource<R extends AidboxResource>(
    reference: AidboxReference<R>,
    deps: ReadonlyArray<any> = []
) {
    return effectAdapter<R>(() => getFHIRResourceAsync(reference), deps);
}

export function getFHIRResources<R extends AidboxResource>(
    resourceType: R['resourceType'],
    params: SearchParams,
    deps: ReadonlyArray<any> = []
) {
    return effectService<Bundle<R>>(
        {
            method: 'GET',
            url: `/${resourceType}`,
            params: { ...params, ...getInactiveSearchParam(resourceType) },
        },
        deps
    );
}

export async function saveFHIRResourceAsync<R extends AidboxResource>(resource: R) {
    return service({
        method: resource.id ? 'PUT' : 'POST',
        data: resource,
        url: `/${resource.resourceType}${resource.id ? '/' + resource.id : ''}`,
    });
}

export function saveFHIRResource<R extends AidboxResource>(resource: R) {
    return effectAdapter<R>(() => saveFHIRResourceAsync(resource))[0];
}

export async function saveFHIRResourcesAsync<R extends AidboxResource>(
    resources: R[],
    bundleType: 'transaction' | 'batch'
) {
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

export function saveFHIRResources<R extends AidboxResource>(resources: R[], bundleType: 'transaction' | 'batch') {
    return effectAdapter<Bundle<R>>(() => saveFHIRResourcesAsync(resources, bundleType))[0];
}

export async function deleteFHIRResourceAsync<R extends AidboxResource>(resource: AidboxReference<R>) {
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

export function deleteFHIRResource<R extends AidboxResource>(resource: AidboxReference<R>) {
    return effectAdapter<R>(() => deleteFHIRResourceAsync(resource))[0];
}

export function getReference<T extends AidboxResource>(
    resource: T,
    display?: string
): AidboxReference<T> {
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

export function extractBundleResources<T extends AidboxResource>(
    bundle: Bundle<T>
): { [P in T['resourceType']]: T[] | undefined } {
    const entriesByResourceType = _.groupBy(bundle.entry, (entry) => _.get(entry, ['resource', 'resourceType']));

    return _.mapValues(entriesByResourceType, (entries) => _.map(entries, (entry) => entry.resource!));
}
