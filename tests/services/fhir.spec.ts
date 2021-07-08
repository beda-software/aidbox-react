import { Bundle, Patient, Practitioner } from 'shared/src/contrib/aidbox';

import { failure, success } from '../../src/libs/remoteData';
import {
    create,
    createFHIRResource,
    get,
    getFHIRResource,
    list,
    getFHIRResources,
    findFHIRResource,
    update,
    updateFHIRResource,
    save,
    saveFHIRResource,
    saveFHIRResources,
    patch,
    patchFHIRResource,
    forceDelete,
    forceDeleteFHIRResource,
    markAsDeleted,
    deleteFHIRResource,
    getReference,
    makeReference,
    isReference,
    extractBundleResources,
    getIncludedResource,
    getIncludedResources,
    getConcepts,
    applyFHIRService,
    applyFHIRServices,
    transformToBundleEntry,
} from '../../src/services/fhir';
import { service } from '../../src/services/service';

jest.mock('../../src/services/service', () => {
    return { service: jest.fn() };
});

describe('Service `fhir`', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (<jest.Mock>service).mockImplementation(() => Promise.resolve(success('data')));
    });

    describe('method `create`', () => {
        test('create resource without search parameters`', async () => {
            const resource = {
                resourceType: 'Patient',
            };

            expect(create(resource)).toEqual({
                method: 'POST',
                url: `/${resource.resourceType}`,
                data: resource,
            });
        });

        test('create resource with search parameters`', () => {
            const resource = {
                resourceType: 'Patient',
            };
            const searchParams = {
                param: 'value',
            };

            expect(create(resource, searchParams)).toEqual({
                method: 'POST',
                url: `/${resource.resourceType}`,
                params: searchParams,
                data: resource,
            });
        });
    });

    test('method `createFHIRResource`', async () => {
        const resource = {
            id: '1',
            resourceType: 'Patient',
        };

        await createFHIRResource(resource);

        expect(service).toHaveBeenLastCalledWith(create(resource));
    });

    describe('method `get`', () => {
        const resource = {
            id: '1',
            resourceType: 'Patient',
        };

        expect(get(resource)).toEqual({
            method: 'GET',
            url: '/' + resource.resourceType + '/' + resource.id,
        });
    });

    test('method `getFHIRResource`', async () => {
        const reference = {
            id: '1',
            resourceType: 'Patient',
        };

        await getFHIRResource(reference);

        expect(service).toHaveBeenLastCalledWith(get(reference));
    });

    describe('method `list`', () => {
        const params = { id: 2 };

        test('create axios config without extra path', () => {
            expect(list('user', params)).toEqual({
                method: 'GET',
                url: '/user',
                params,
            });
        });

        test('create axios config with extra path', () => {
            expect(list('user', params, 'extra')).toEqual({
                method: 'GET',
                url: '/user/extra',
                params,
            });
        });
    });

    describe('method `getFHIRResources`', () => {
        const params = { id: 2 };

        test('get resource without extra path', async () => {
            await getFHIRResources('user', params);

            expect(service).toHaveBeenLastCalledWith(list('user', params));
        });

        test('get resource with extra path', async () => {
            await getFHIRResources('user', params, 'extra');

            expect(service).toHaveBeenLastCalledWith(list('user', params, 'extra'));
        });
    });

    describe('method `update`', () => {
        test('update resource with meta versionId', () => {
            const resource = {
                resourceType: 'Patient',
                id: '1',
                meta: {
                    versionId: '1',
                },
            };

            expect(update(resource)).toEqual({
                method: 'PUT',
                url: `/${resource.resourceType}/${resource.id}`,
                data: resource,
                headers: {
                    'If-Match': resource.meta.versionId,
                },
            });
        });
        test('update resource without meta versionId', () => {
            const resource = {
                resourceType: 'Patient',
                id: '1',
            };

            expect(update(resource)).toEqual({
                method: 'PUT',
                url: `/${resource.resourceType}/${resource.id}`,
                data: resource,
            });
        });

        test('update resource without id', () => {
            const resource = {
                resourceType: 'Patient',
            };

            expect(() => {
                update(resource);
            }).toThrow();
        });

        test('update resource without id with search params', () => {
            const resource = {
                resourceType: 'Patient',
            };
            const searchParams = { param: 'value' };

            expect(update(resource, searchParams)).toEqual({
                method: 'PUT',
                url: `/${resource.resourceType}`,
                data: resource,
                params: searchParams,
            });
        });
    });

    test('method `updateFHIRResource`', async () => {
        const resource = {
            resourceType: 'Patient',
            id: '1',
        };
        const searchParams = { param: 'value' };

        await updateFHIRResource(resource, searchParams);

        expect(service).toHaveBeenLastCalledWith(update(resource, searchParams));
    });

    describe('method `save`', () => {
        test('save resource without id', () => {
            const resource = {
                resourceType: 'Patient',
            };

            expect(save(resource)).toEqual({
                method: 'POST',
                url: '/Patient',
                data: resource,
            });
        });

        test('save resource with id', () => {
            const resource = {
                resourceType: 'Patient',
                id: '1',
            };

            expect(save(resource)).toEqual({
                method: 'PUT',
                url: '/Patient/1',
                data: resource,
            });
        });

        test('save resource with meta versionId', () => {
            const resource = {
                resourceType: 'Patient',
                id: '1',
                meta: {
                    versionId: '1',
                },
            };

            expect(update(resource)).toEqual({
                method: 'PUT',
                url: `/${resource.resourceType}/${resource.id}`,
                data: resource,
                headers: {
                    'If-Match': resource.meta.versionId,
                },
            });
        });
    });

    describe('method `saveFHIRResource`', () => {
        test('save resource without id', async () => {
            const resource = {
                resourceType: 'Patient',
            };

            await saveFHIRResource(resource);

            expect(service).toHaveBeenLastCalledWith(save(resource));
        });

        test('save resource with id', async () => {
            const resource = {
                resourceType: 'Patient',
                id: '1',
            };

            await saveFHIRResource(resource);

            expect(service).toHaveBeenLastCalledWith(save(resource));
        });

        test('save resource with meta versionId', async () => {
            const resource = {
                resourceType: 'Patient',
                id: '1',
                meta: {
                    versionId: '1',
                },
            };

            await saveFHIRResource(resource);

            expect(service).toHaveBeenLastCalledWith(save(resource));
        });
    });

    test('method `saveFHIRResources`', async () => {
        const bundleType = 'transaction';
        const resources = [
            { id: '1', resourceType: 'Patient' },
            { id: '2', resourceType: 'Patient' },
            { id: '3', resourceType: 'Patient', meta: { versionId: '1' } },
            { resourceType: 'Patient' },
        ];

        await saveFHIRResources(resources, bundleType);

        expect(service).toHaveBeenLastCalledWith({
            method: 'POST',
            url: '/',
            data: {
                type: bundleType,
                entry: [
                    {
                        request: {
                            method: 'PUT',
                            url: '/Patient/1',
                        },
                        resource: {
                            id: '1',
                            resourceType: 'Patient',
                        },
                    },
                    {
                        request: {
                            method: 'PUT',
                            url: '/Patient/2',
                        },
                        resource: {
                            id: '2',
                            resourceType: 'Patient',
                        },
                    },
                    {
                        request: {
                            method: 'PUT',
                            url: '/Patient/3',
                            ifMatch: '1',
                        },
                        resource: {
                            id: '3',
                            resourceType: 'Patient',
                            meta: {
                                versionId: '1',
                            },
                        },
                    },
                    {
                        request: {
                            method: 'POST',
                            url: '/Patient',
                        },
                        resource: {
                            resourceType: 'Patient',
                        },
                    },
                ],
            },
        });
    });

    describe('method `findFHIRResource`', () => {
        test('returns failure when nothing found', async () => {
            const params = { id: 1 };
            const resourceType = 'Patient';

            (<jest.Mock>service).mockImplementation(() => Promise.resolve(success({ entry: [] })));

            const response = await findFHIRResource(resourceType, params);
            expect(service).toHaveBeenLastCalledWith({
                method: 'GET',
                url: `/${resourceType}`,
                params: { ...params, 'active:not': [false] },
            });
            expect(response).toEqual(
                failure({
                    error_description: 'No resources found',
                    error: 'no_resources_found',
                })
            );
        });

        test('returns failure when multiple resources found', async () => {
            const id = 'patient-id';
            const params = { _id: id };
            const resourceType = 'Patient';
            const resource = { resourceType, id };
            (<jest.Mock>service).mockImplementation(() =>
                Promise.resolve(success({ entry: [{ resource }, { resource }] }))
            );

            const response = await findFHIRResource(resourceType, params);
            expect(service).toHaveBeenLastCalledWith({
                method: 'GET',
                url: `/${resourceType}`,
                params: { ...params, 'active:not': [false] },
            });
            expect(response).toEqual(
                failure({
                    error_description: 'Too many resources found',
                    error: 'too_many_resources_found',
                })
            );
        });

        test('returns success when exactly one resource found', async () => {
            const id = 'patient-id';
            const params = { _id: id };
            const resourceType = 'Patient';
            const resource = { resourceType, id };

            (<jest.Mock>service).mockImplementation(() =>
                Promise.resolve(
                    success({
                        entry: [
                            {
                                resource,
                            },
                        ],
                    })
                )
            );

            const response = await findFHIRResource(resourceType, params);
            expect(service).toHaveBeenLastCalledWith({
                method: 'GET',
                url: `/${resourceType}`,
                params: { ...params, 'active:not': [false] },
            });
            expect(response).toEqual(success(resource));
        });

        test('receive extra path argument', async () => {
            const params = { id: 1 };
            const resourceType = 'Patient';
            const extraPath = 'extraPath';

            await findFHIRResource(resourceType, params, extraPath);

            expect(service).toHaveBeenLastCalledWith({
                method: 'GET',
                url: `/${resourceType}/${extraPath}`,
                params: { ...params, 'active:not': [false] },
            });
        });
    });

    describe('method `patch`', () => {
        test('patch resource without search params', async () => {
            const resource = {
                id: '1',
                resourceType: 'Patient',
            };

            await patchFHIRResource(resource);

            expect(patch(resource)).toEqual({
                method: 'PATCH',
                data: resource,
                url: `/${resource.resourceType}/${resource.id}`,
            });
        });

        test('patch resource with search params', async () => {
            const resource = {
                id: '1',
                resourceType: 'Patient',
            };
            const searchParams = { param: 'value' };

            await patchFHIRResource(resource);

            expect(patch(resource, searchParams)).toEqual({
                method: 'PATCH',
                data: resource,
                url: `/${resource.resourceType}`,
                params: searchParams,
            });
        });

        test('patch resource without id', () => {
            const resource = {
                resourceType: 'Patient',
            };

            expect(() => {
                patch(resource);
            }).toThrow();
        });
    });

    test('method `patchFHIRResource`', async () => {
        const resource = {
            id: '1',
            resourceType: 'Patient',
        };

        await patchFHIRResource(resource);

        expect(service).toHaveBeenLastCalledWith(patch(resource));
    });

    describe('method `markAsDeleted`', () => {
        test('delete unknown resource', () => {
            const resource = {
                id: '1',
                resourceType: 'Unknown',
            };
            expect(() => {
                markAsDeleted(resource);
            }).toThrow();
        });

        test('delete location resource', () => {
            const resource = {
                id: '1',
                resourceType: 'Location',
            };

            expect(markAsDeleted(resource)).toEqual({
                method: 'PATCH',
                url: `/${resource.resourceType}/${resource.id}`,
                data: {
                    status: 'inactive',
                },
            });
        });
    });

    describe('method `deleteFHIRResource`', () => {
        test('delete unknown resource', async () => {
            const resource = {
                id: '1',
                resourceType: 'Unknown',
            };
            expect(deleteFHIRResource(resource)).rejects.toThrow();
        });

        test('delete location resource', async () => {
            const resource = {
                id: '1',
                resourceType: 'Location',
            };

            await deleteFHIRResource(resource);

            expect(service).toHaveBeenLastCalledWith(markAsDeleted(resource));
        });
    });

    describe('method `forceDelete`', () => {
        test('delete resource by id', () => {
            const resourceType = 'Patient';
            const id = '1';

            expect(forceDelete(resourceType, id)).toEqual({
                method: 'DELETE',
                url: `/${resourceType}/${id}`,
            });
        });

        test('delete resource by search params', () => {
            const resourceType = 'Patient';
            const searchParams = { id: '1' };

            expect(forceDelete(resourceType, searchParams)).toEqual({
                method: 'DELETE',
                url: `/${resourceType}`,
                params: searchParams,
            });
        });
    });

    test('method `forceDeleteFHIRResource`', async () => {
        const resource = {
            resourceType: 'Patient',
            id: '1',
        };

        await forceDeleteFHIRResource(resource);

        expect(service).toHaveBeenLastCalledWith(forceDelete(resource.resourceType, resource.id));
    });

    test('method `getReference`', () => {
        const id = '1';
        const resourceType = 'Patient';
        const resource = { id, resourceType };

        expect(getReference(resource)).toEqual({
            id,
            resourceType,
        });

        expect(getReference(resource, 'value')).toEqual({
            id,
            resourceType,
            display: 'value',
        });
    });

    test('method `makeReference`', () => {
        const id = '1';
        const resourceType = 'Patient';

        expect(makeReference(resourceType, id)).toEqual({ id, resourceType });
    });

    test('method `isReference`', () => {
        expect(
            isReference({
                id: '1',
                resourceType: 'Patient',
            })
        ).toBeTruthy();

        expect(
            isReference({
                id: '1',
                resourceType: 'Patient',
                extraField: true,
            })
        ).toBeFalsy();

        expect(isReference({} as any)).toBeTruthy();
    });

    describe('method `extractBundleResources`', () => {
        test("extract empty object when there's not entry property", () => {
            const bundle: Bundle<Patient | Practitioner> = {
                resourceType: 'Bundle',
                type: 'searchset',
            };

            expect(extractBundleResources(bundle).Practitioner).toEqual([]);
            expect(extractBundleResources(bundle).Patient).toEqual([]);
        });
        test("extract bundle there's entry field property", () => {
            const bundle: Bundle<Patient | Practitioner> = {
                resourceType: 'Bundle',
                type: 'searchset',
                entry: [
                    {
                        resource: {
                            id: '1',
                            resourceType: 'Patient',
                        },
                    },
                    {
                        resource: {
                            id: '2',
                            resourceType: 'Patient',
                        },
                    },
                    {
                        resource: {
                            id: '3',
                            resourceType: 'Patient',
                        },
                    },
                    {
                        resource: {
                            id: '4',
                            resourceType: 'Practitioner',
                        },
                    },
                ],
            };

            expect(extractBundleResources(bundle)).toEqual({
                Patient: [
                    { id: '1', resourceType: 'Patient' },
                    { id: '2', resourceType: 'Patient' },
                    { id: '3', resourceType: 'Patient' },
                ],
                Practitioner: [{ id: '4', resourceType: 'Practitioner' }],
            });
        });
    });

    describe('method `getIncludedResource`', () => {
        const resources = {
            customType: [{ id: '1' }, { id: '3' }],
        };

        test('returns resource when it exists', () => {
            const reference = { id: '1', resourceType: 'customType' };

            expect(getIncludedResource(resources, reference)).toEqual({ id: '1' });
        });

        test('returns resource when it exists', () => {
            const reference = { id: '2', resourceType: 'customType' };

            expect(getIncludedResource(resources, reference)).toBeUndefined();
        });

        test("don't returns resource when it exists", () => {
            const reference = { id: '3', resourceType: 'unknownType' };

            expect(getIncludedResource(resources, reference)).toBeUndefined();
        });
    });

    describe('method `getIncludedResources`', () => {
        test('returns resources when exists', async () => {
            const customTypeResources = [1, 2, 3];
            const resourceType = 'customType';
            const resources = {
                customType: customTypeResources,
            };

            expect(getIncludedResources(resources, resourceType)).toEqual(customTypeResources);
        });

        test("returns empty array when there aren't", async () => {
            const customTypeResources = [1, 2, 3];
            const resourceType = 'unknownType';
            const resources = {
                customType: customTypeResources,
            };

            expect(getIncludedResources(resources, resourceType)).toEqual([]);
        });
    });

    test('method `getConcepts`', async () => {
        const valueSetId = '1';
        const params = {
            a: 1,
            b: 2,
        };

        await getConcepts(valueSetId, params);

        expect(service).toHaveBeenLastCalledWith({
            method: 'GET',
            url: `/ValueSet/${valueSetId}/$expand`,
            params,
        });
    });

    test('method `applyFHIRService`', async () => {
        const resource = {
            resourceType: 'Patient',
        };

        const result = await applyFHIRService(create(resource));

        expect(result).toEqual(success('data'));
    });

    describe('method `applyFHIRServices`', () => {
        test('apply transaction', async () => {
            const result = await applyFHIRServices([
                create({
                    resourceType: 'Patient',
                }),
                update({
                    resourceType: 'Patient',
                    id: '42',
                }),
                forceDelete('Patient', '42'),
            ]);

            expect(service).toHaveBeenLastCalledWith({
                url: '/',
                method: 'POST',
                data: {
                    type: 'transaction',
                    entry: [
                        {
                            request: {
                                method: 'POST',
                                url: '/Patient',
                            },
                            resource: {
                                resourceType: 'Patient',
                            },
                        },
                        {
                            request: {
                                method: 'PUT',
                                url: '/Patient/42',
                            },
                            resource: {
                                resourceType: 'Patient',
                                id: '42',
                            },
                        },
                        {
                            request: {
                                method: 'DELETE',
                                url: '/Patient/42',
                            },
                        },
                    ],
                },
            });
            expect(result).toEqual(success('data'));
        });

        test('apply batch', async () => {
            const result = await applyFHIRServices([forceDelete('Patient', '42')], 'batch');

            expect(service).toHaveBeenLastCalledWith({
                url: '/',
                method: 'POST',
                data: {
                    type: 'batch',
                    entry: [
                        {
                            request: {
                                method: 'DELETE',
                                url: '/Patient/42',
                            },
                        },
                    ],
                },
            });
            expect(result).toEqual(success('data'));
        });
    });

    describe('Method `transformToBundleEntry`', () => {
        test('returns null when config is empty', () => {
            const config = {};
            expect(transformToBundleEntry(config)).toBeNull();
        });

        test('process params', () => {
            const config = {
                url: '/',
                method: 'GET',
                params: { a: 42 },
            };

            expect(transformToBundleEntry(config as any)).toEqual({
                request: {
                    url: '/?a=42',
                    method: 'GET',
                },
            });
        });

        test('process data', () => {
            const config = {
                url: '/',
                method: 'POST',
                data: { a: 42 },
            };

            expect(transformToBundleEntry(config as any)).toEqual({
                resource: {
                    a: 42,
                },
                request: {
                    url: '/',
                    method: 'POST',
                },
            });
        });

        test('process `If-None-Exist` header', () => {
            const config = {
                url: '/',
                method: 'POST',
                data: {
                    resourceType: 'Patient',
                    id: '42',
                },
                headers: {
                    'If-None-Exist': { a: '42' },
                },
            };

            expect(transformToBundleEntry(config as any)).toEqual({
                resource: {
                    resourceType: 'Patient',
                    id: '42',
                },
                request: {
                    url: '/',
                    method: 'POST',
                    ifNoneExist: 'a=42',
                },
            });
        });

        test('process `If-Match` header', () => {
            const config = {
                url: '/',
                method: 'POST',
                data: {
                    resourceType: 'Patient',
                    id: '42',
                },
                headers: {
                    'If-Match': '41',
                },
            };

            expect(transformToBundleEntry(config as any)).toEqual({
                resource: {
                    resourceType: 'Patient',
                    id: '42',
                },
                request: {
                    url: '/',
                    method: 'POST',
                    ifMatch: '41',
                },
            });
        });
    });
});
