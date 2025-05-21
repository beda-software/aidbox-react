import { AxiosRequestConfig } from 'axios';
import { AidboxReference, AidboxResource, ValueSet, Bundle, BundleEntry, id } from 'shared/src/contrib/aidbox';

import { isFailure, RemoteDataResult, success, failure } from '../libs/remoteData';
import { cleanObject } from '../utils/fhir';
import { buildQueryParams } from './instance';
import { SearchParams } from './search';
import { service } from './service';

interface InactiveMappingItem {
    searchField: string;
    statusField: string;
    value: any;
}

interface InactiveMapping {
    [resourceType: string]: InactiveMappingItem;
}

// This type-wrapper is used to wrap AidboxResource to make `id` attr required
// It's needed when we make requests to the FHIR server - initially all resources
// have id non-mandatory, but after request (GET/POST etc) the returned resource always
// has id.
export type WithId<T extends AidboxResource> = T & Required<Pick<T, 'id'>>;

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
    EpisodeOfCare: {
        searchField: 'status',
        statusField: 'status',
        value: 'entered-in-error',
    },
};

function isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
}

function getInactiveSearchParam(resourceType: string) {
    const item = inactiveMapping[resourceType];

    if (item) {
        return {
            [`${item.searchField}:not`]: [item.value],
        };
    }

    return {};
}

export async function createFHIRResource<R extends AidboxResource>(
    resource: R,
    searchParams?: SearchParams,
    needToCleanResource = true
): Promise<RemoteDataResult<WithId<R>>> {
    return service(create(resource, searchParams, needToCleanResource));
}

export function create<R extends AidboxResource>(
    resource: R,
    searchParams?: SearchParams,
    needToCleanResource = true
): AxiosRequestConfig {
    let cleanedResource = resource;
    if (needToCleanResource) {
        cleanedResource = cleanObject(cleanedResource);
    }

    return {
        method: 'POST',
        url: `/${cleanedResource.resourceType}`,
        params: searchParams,
        data: cleanedResource,
    };
}

export async function updateFHIRResource<R extends AidboxResource>(
    resource: R,
    searchParams?: SearchParams,
    needToCleanResource = true
): Promise<RemoteDataResult<WithId<R>>> {
    return service(update(resource, searchParams, needToCleanResource));
}

export function update<R extends AidboxResource>(
    resource: R,
    searchParams?: SearchParams,
    needToCleanResource = true
): AxiosRequestConfig {
    let cleanedResource = resource;
    if (needToCleanResource) {
        cleanedResource = cleanObject(cleanedResource);
    }

    if (searchParams) {
        return {
            method: 'PUT',
            url: `/${cleanedResource.resourceType}`,
            data: cleanedResource,
            params: searchParams,
        };
    }

    if (cleanedResource.id) {
        const versionId = cleanedResource.meta && cleanedResource.meta.versionId;

        return {
            method: 'PUT',
            url: `/${cleanedResource.resourceType}/${cleanedResource.id}`,
            data: cleanedResource,
            ...(versionId ? { headers: { 'If-Match': versionId } } : {}),
        };
    }

    throw new Error('Resourse id and search parameters are not specified');
}

export async function getFHIRResource<R extends AidboxResource>(
    reference: AidboxReference<R>
): Promise<RemoteDataResult<WithId<R>>> {
    return service(get(reference));
}

export function get<R extends AidboxResource>(reference: AidboxReference<R>): AxiosRequestConfig {
    return {
        method: 'GET',
        url: `/${reference.resourceType}/${reference.id}`,
    };
}

export async function getFHIRResources<R extends AidboxResource>(
    resourceType: R['resourceType'],
    searchParams: SearchParams,
    extraPath?: string
): Promise<RemoteDataResult<Bundle<WithId<R>>>> {
    return service(list(resourceType, searchParams, extraPath));
}

export async function getAllFHIRResources<R extends AidboxResource>(
    resourceType: string,
    params: SearchParams,
    extraPath?: string
): Promise<RemoteDataResult<Bundle<WithId<R>>>> {
    const resultBundleResponse = await getFHIRResources<R>(resourceType, params, extraPath);

    if (isFailure(resultBundleResponse)) {
        return resultBundleResponse;
    }

    let resultBundle = resultBundleResponse.data;

    while (true) {
        let nextLink = resultBundle.link?.find((link) => {
            return link.relation === 'next';
        });

        if (!nextLink) {
            break;
        }

        const response = await service({
            method: 'GET',
            url: nextLink.url,
        });

        if (isFailure(response)) {
            return response;
        }

        resultBundle = {
            ...response.data,
            entry: [...resultBundle.entry!, ...response.data.entry],
        };
    }

    return success(resultBundle);
}

export function list<R extends AidboxResource>(
    resourceType: R['resourceType'],
    searchParams: SearchParams,
    extraPath?: string
): AxiosRequestConfig {
    return {
        method: 'GET',
        url: extraPath ? `/${resourceType}/${extraPath}` : `/${resourceType}`,
        params: { ...searchParams, ...getInactiveSearchParam(resourceType) },
    };
}

export async function findFHIRResource<R extends AidboxResource>(
    resourceType: R['resourceType'],
    params: SearchParams,
    extraPath?: string
): Promise<RemoteDataResult<WithId<R>>> {
    const response = await getFHIRResources<R>(resourceType, params, extraPath);

    if (isFailure(response)) {
        return response;
    }

    const resources = extractBundleResources(response.data)[resourceType] as WithId<R>[];

    if (resources.length === 1) {
        return success(resources[0]);
    } else if (resources.length === 0) {
        return failure({ error_description: 'No resources found', error: 'no_resources_found' });
    } else {
        return failure({
            error_description: 'Too many resources found',
            error: 'too_many_resources_found',
        });
    }
}

export async function saveFHIRResource<R extends AidboxResource>(
    resource: R,
    needToCleanResource = true
): Promise<RemoteDataResult<WithId<R>>> {
    return service(save(resource, needToCleanResource));
}

export function save<R extends AidboxResource>(resource: R, needToCleanResource = true): AxiosRequestConfig {
    let cleanedResource = resource;
    if (needToCleanResource) {
        cleanedResource = cleanObject(cleanedResource);
    }
    const versionId = cleanedResource.meta && cleanedResource.meta.versionId;

    return {
        method: resource.id ? 'PUT' : 'POST',
        data: cleanedResource,
        url: `/${resource.resourceType}${resource.id ? '/' + resource.id : ''}`,
        ...(resource.id && versionId ? { headers: { 'If-Match': versionId } } : {}),
    };
}

export async function saveFHIRResources<R extends AidboxResource>(
    resources: R[],
    bundleType: 'transaction' | 'batch',
    needToCleanResource = true
): Promise<RemoteDataResult<Bundle<WithId<R>>>> {
    return service({
        method: 'POST',
        url: '/',
        data: {
            type: bundleType,
            entry: resources.map((resource) => {
                let cleanedResource = resource;
                if (needToCleanResource) {
                    cleanedResource = cleanObject(cleanedResource);
                }
                const versionId = cleanedResource.meta && cleanedResource.meta.versionId;

                return {
                    resource: cleanedResource,
                    request: {
                        method: cleanedResource.id ? 'PUT' : 'POST',
                        url: `/${cleanedResource.resourceType}${cleanedResource.id ? '/' + cleanedResource.id : ''}`,
                        ...(cleanedResource.id && versionId ? { ifMatch: versionId } : {}),
                    },
                };
            }),
        },
    });
}

type NullableRecursivePartial<T> = {
    [P in keyof T]?: NullableRecursivePartial<T[P]> | null;
};

export async function patchFHIRResource<R extends AidboxResource>(
    resource: NullableRecursivePartial<R> & Required<Pick<R, 'id' | 'resourceType'>>,
    searchParams?: SearchParams
): Promise<RemoteDataResult<WithId<R>>> {
    return service(patch(resource, searchParams));
}

export function patch<R extends AidboxResource>(
    resource: NullableRecursivePartial<R> & Required<Pick<R, 'resourceType'>>,
    searchParams?: SearchParams
): AxiosRequestConfig {
    if (searchParams) {
        return {
            method: 'PATCH',
            url: `/${resource.resourceType}`,
            data: resource,
            params: searchParams,
        };
    }

    if (resource.id) {
        return {
            method: 'PATCH',
            url: `/${resource.resourceType}/${resource.id}`,
            data: resource,
        };
    }

    throw new Error('Resourse id and search parameters are not specified');
}

export async function deleteFHIRResource<R extends AidboxResource>(
    resource: AidboxReference<R>
): Promise<RemoteDataResult<WithId<R>>> {
    return service(markAsDeleted(resource));
}

export function markAsDeleted<R extends AidboxResource>(resource: AidboxReference<R>): AxiosRequestConfig {
    const inactiveMappingItem = inactiveMapping[resource.resourceType];

    if (!inactiveMappingItem) {
        throw new Error(`Specify inactiveMapping for ${resource.resourceType} to mark item deleted`);
    }

    return {
        method: 'PATCH',
        url: `/${resource.resourceType}/${resource.id}`,
        data: {
            [inactiveMappingItem.statusField]: inactiveMappingItem.value,
        },
    };
}

export async function forceDeleteFHIRResource<R extends AidboxResource>(
    resource: AidboxReference<R>
): Promise<RemoteDataResult<WithId<R>>> {
    return service(forceDelete(resource.resourceType, resource.id));
}

export function forceDelete<R extends AidboxResource>(
    resourceType: R['resourceType'],
    idOrSearchParams: id | SearchParams
): AxiosRequestConfig {
    if (isObject(idOrSearchParams)) {
        return {
            method: 'DELETE',
            url: `/${resourceType}`,
            params: idOrSearchParams,
        };
    }

    return {
        method: 'DELETE',
        url: `/${resourceType}/${idOrSearchParams}`,
    };
}

export function getReference<T extends AidboxResource>(resource: T, display?: string): AidboxReference<T> {
    return {
        resourceType: resource.resourceType,
        id: resource.id!,
        ...(display ? { display } : {}),
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

export function isReference<T extends AidboxResource>(
    resource: T | AidboxReference<T>
): resource is AidboxReference<T> {
    return !Object.keys(resource).filter(
        (attribute) =>
            ['id', 'resourceType', '_id', 'resource', 'display', 'identifier', 'uri', 'localRef', 'extension'].indexOf(
                attribute
            ) === -1
    ).length;
}

export type ResourcesMap<T extends AidboxResource> = {
    [P in T['resourceType']]: T extends { resourceType: P } ? T[] : never;
};

export function extractBundleResources<T extends AidboxResource>(bundle: Bundle<T>): ResourcesMap<T> {
    const entriesByResourceType = {} as ResourcesMap<T>;
    const entries = bundle.entry || [];
    entries.forEach(function (entry) {
        const type = entry.resource!.resourceType;
        if (!entriesByResourceType[type]) {
            entriesByResourceType[type] = [];
        }
        entriesByResourceType[type].push(entry.resource);
    });

    return new Proxy(entriesByResourceType, {
        get: (obj, prop) => (obj.hasOwnProperty(prop) ? obj[prop] : []),
    });
}

export function getIncludedResource<T extends AidboxResource>(
    // TODO: improve type for includedResources: must contain T
    resources: ResourcesMap<T | any>,
    reference: AidboxReference<T>
): T | undefined {
    const typeResources = resources[reference.resourceType];
    if (!typeResources) {
        return undefined;
    }
    const index = typeResources.findIndex((resource: T) => resource.id === reference.id);
    return typeResources[index];
}

export function getIncludedResources<T extends AidboxResource>(
    // TODO: improve type for includedResources: must contain T
    resources: ResourcesMap<T | any>,
    resourceType: T['resourceType']
): T[] {
    return (resources[resourceType] || []) as T[];
}

export function getMainResources<T extends AidboxResource>(bundle: Bundle<T>, resourceType: T['resourceType']): T[] {
    if (!bundle.entry) {
        return [];
    }

    return bundle.entry
        .filter((entry) => entry.resource?.resourceType === resourceType)
        .map((entry) => entry.resource!);
}

export function getConcepts(valueSetId: string, params?: SearchParams): Promise<RemoteDataResult<ValueSet>> {
    return service({
        method: 'GET',
        url: `/ValueSet/${valueSetId}/$expand`,
        params: { ...params },
    });
}

export async function applyFHIRService<T extends AidboxResource, F = any>(
    request: AxiosRequestConfig
): Promise<RemoteDataResult<WithId<T>, F>> {
    return service<WithId<T>, F>(request);
}

const toCamelCase = (str: string): string => {
    const withFirstLowerLetter = str.charAt(0).toLowerCase() + str.slice(1);
    return withFirstLowerLetter.replace(/-/gi, '');
};

export function transformToBundleEntry<R extends AidboxResource>(config: AxiosRequestConfig): BundleEntry<R> | null {
    const { method, url, data, params, headers = [] } = config;

    if (!method || !url) {
        return null;
    }
    const request = {
        method,
        url: isObject(params) ? url + '?' + buildQueryParams(params) : url,
    };

    ['If-Modified-Since', 'If-Match', 'If-None-Match', 'If-None-Exist'].forEach((header) => {
        if (headers[header]) {
            request[toCamelCase(header)] = isObject(headers[header])
                ? buildQueryParams(headers[header])
                : headers[header];
        }
    });

    return {
        ...(data ? { resource: data } : {}),
        request,
    };
}

export async function applyFHIRServices<T extends AidboxResource, F = any>(
    requests: Array<AxiosRequestConfig>,
    type: 'transaction' | 'batch' = 'transaction'
): Promise<RemoteDataResult<Bundle<WithId<T>>, F>> {
    return service<Bundle<WithId<T>>, F>({
        method: 'POST',
        url: '/',
        data: {
            type,
            entry: requests.map(transformToBundleEntry).filter((entry) => entry !== null),
        },
    });
}
