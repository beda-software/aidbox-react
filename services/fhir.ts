import _ from 'lodash';

import { AidboxReference, AidboxResource, Bundle } from 'src/contrib/aidbox';

import { failure, RemoteData } from '../libs/remoteData';
import { effectService } from './service';

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

export function getFHIRResource<R extends AidboxResource>(
    reference: AidboxReference<R>,
    deps: ReadonlyArray<any> = []
) {
    return effectService<R>(
        {
            method: 'GET',
            url: `/${reference.resourceType}/${reference.id}`,
        },
        deps
    );
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

export function saveFHIRResource<R extends AidboxResource>(resource: R) {
    return effectService<R>({
        method: resource.id ? 'PUT' : 'POST',
        data: resource,
        url: `/${resource.resourceType}${resource.id ? '/' + resource.id : ''}`,
    })[0];
}

export function saveFHIRResources<R extends AidboxResource>(resources: R[], bundleType: 'transaction' | 'batch') {
    return effectService<Bundle<R>>({
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
    })[0];
}

export function deleteFHIRResource<R extends AidboxResource>(resource: AidboxReference<R>): RemoteData<R> {
    const inactiveMappingItem = inactiveMapping[resource.resourceType];

    if (!inactiveMappingItem) {
        console.error(`Please specify inactiveMapping for ${resource.resourceType} to mark item deleted`);

        return failure({});
    }

    return effectService<R>({
        method: 'PATCH',
        url: `/${resource.resourceType}/${resource.id}`,
        data: {
            [inactiveMappingItem.statusField]: inactiveMappingItem.value,
        },
    })[0];
}

export function getReference<T extends AidboxResource & { id: string }>(
    resource: T,
    display?: string
): AidboxReference<T> {
    return {
        resourceType: resource.resourceType,
        id: resource.id,
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
