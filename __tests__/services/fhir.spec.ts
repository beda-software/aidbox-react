import {
    create,
    createFHIRResource,
    get,
    getFHIRResource,
    list,
    getFHIRResources,
    find,
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
} from '../../services/fhir';
import { service } from '../../services/service';
import { success, failure } from '../../libs/remoteData';
import { Bundle, AidboxResource } from 'src/contrib/aidbox';
import { AxiosTransformer } from 'axios';

jest.mock('../../services/service', () => {
    return { service: jest.fn(() => Promise.resolve(success('data'))) };
});

describe.only('Service `fhir`', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
                data: resource,
                headers: {
                    'If-None-Exist': searchParams,
                },
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
        test('get resource without search params', () => {
            const resource = {
                id: '1',
                resourceType: 'Patient',
            };

            expect(get(resource)).toEqual({
                method: 'GET',
                url: '/' + resource.resourceType + '/' + resource.id,
            });
        });
        test('get resource with search params', () => {
            const resource = {
                id: '1',
                resourceType: 'Patient',
            };
            const searchParams = { param: 'value' };

            expect(get(resource, searchParams)).toEqual({
                method: 'GET',
                url: '/' + resource.resourceType + '/' + resource.id,
                params: searchParams,
            });
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

            const searchParams = { param: 'value' };

            expect(update(resource, searchParams)).toEqual({
                method: 'PUT',
                url: `/${resource.resourceType}/${resource.id}`,
                params: searchParams,
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
    });

    test('method `saveFHIRResources`', async () => {
        const bundleType = 'transaction';
        const resources = [
            { id: '1', resourceType: 'Patient' },
            { id: '2', resourceType: 'Patient' },
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

    describe('method `find`', () => {
        test('has correct behavior', async () => {
            const params = { id: 1 };
            const resourceType = 'Patient';

            const axiosRequestConfig = find(resourceType, params);
            const transformResponse = axiosRequestConfig.transformResponse as AxiosTransformer;

            expect(axiosRequestConfig).toEqual(
                expect.objectContaining({
                    method: 'GET',
                    url: '/' + resourceType,
                    params: {
                        'active:not': [false],
                        id: 1,
                    },
                })
            );

            expect(() => {
                const response = '';
                transformResponse(response);
            }).toThrow();

            expect(() => {
                const response = '{"entry":[]}';
                transformResponse(response);
            }).toThrow();

            const response = '{"entry":[{"resource": "data"}]}';
            const transformed = transformResponse(response);

            expect(transformed).toBe('data');

            expect(() => {
                const response = '{"entry":[{"resource": "a"}, {"resource": "b"}]}';
                transformResponse(response);
            }).toThrow();
        });

        test('receive extra path argument', async () => {
            const params = { id: 1 };
            const resourceType = 'Patient';
            const extraPath = 'extraPath';

            expect(find(resourceType, params, extraPath)).toEqual(
                expect.objectContaining({
                    method: 'GET',
                    url: '/' + resourceType + '/' + extraPath,
                    params: {
                        'active:not': [false],
                        id: 1,
                    },
                })
            );
        });
    });

    describe('method `findFHIRResource`', () => {
        test('has correct behavior', async () => {
            const params = { id: 1 };
            const resourceType = 'Patient';

            await findFHIRResource(resourceType, params);
            const { transformResponse, ...restFindResult } = find(resourceType, params);

            expect(service).toHaveBeenLastCalledWith(expect.objectContaining(restFindResult));
        });

        test('receive extra path argument', async () => {
            const params = { id: 1 };
            const resourceType = 'Patient';
            const extraPath = 'extraPath';

            await findFHIRResource(resourceType, params, extraPath);

            const { transformResponse, ...restFindResult } = find(resourceType, params, extraPath);

            expect(service).toHaveBeenLastCalledWith(expect.objectContaining(restFindResult));
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
                url: `/${resource.resourceType}/${resource.id}`,
                params: searchParams,
            });
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
            const result = markAsDeleted({
                id: '1',
                resourceType: 'Unknown',
            });

            expect(result).toEqual({});
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
            const result = await deleteFHIRResource(resource);

            expect(result).toEqual(failure({}));
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
        test('has correct behavior without `params` argument', async () => {
            const resource = {
                id: '1',
                resourceType: 'Patient',
            };

            expect(forceDelete(resource)).toEqual({
                method: 'DELETE',
                url: `/${resource.resourceType}/${resource.id}`,
                params: {},
            });
        });

        test('has correct behavior with `params` argument', async () => {
            const resource = {
                id: '1',
                resourceType: 'Patient',
            };
            const params = { id: 2 };

            expect(forceDelete(resource, params)).toEqual({
                method: 'DELETE',
                url: `/${resource.resourceType}/${resource.id}`,
                params,
            });
        });
    });

    describe('method `forceDeleteFHIRResource`', () => {
        test('has correct behavior without `params` argument', async () => {
            const resource = {
                id: '1',
                resourceType: 'Patient',
            };

            await forceDeleteFHIRResource(resource);

            expect(service).toHaveBeenLastCalledWith(forceDelete(resource));
        });

        test('has correct behavior with `params` argument', async () => {
            const resource = {
                id: '1',
                resourceType: 'Patient',
            };
            const params = { id: 2 };

            await forceDeleteFHIRResource(resource, params);

            expect(service).toHaveBeenLastCalledWith(forceDelete(resource, params));
        });
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

    test('method `extractBundleResources`', () => {
        const bundle = {
            resourceType: 'Bundle',
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
                        resourceType: 'customType',
                    },
                },
            ],
        } as Bundle<AidboxResource>;

        expect(extractBundleResources(bundle)).toEqual({
            Patient: [
                { id: '1', resourceType: 'Patient' },
                { id: '2', resourceType: 'Patient' },
                { id: '3', resourceType: 'Patient' },
            ],
            customType: [{ id: '4', resourceType: 'customType' }],
        });
    });

    test('method `getIncludedResource`', () => {
        const resources = {
            customType: [{ id: '1' }],
        };

        const referenceFirst = { id: '1', resourceType: 'customType' };
        const referenceSecond = { id: '2', resourceType: 'customType' };

        expect(getIncludedResource(resources, referenceFirst)).toBeTruthy();
        expect(getIncludedResource(resources, referenceSecond)).toBeFalsy();
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

    test('method `applyFHIRServices`', async () => {
        const result = await applyFHIRServices([
            create({
                resourceType: 'Patient',
            }),
            update({
                resourceType: 'Patient',
                id: '42',
            }),
            forceDelete({
                resourceType: 'Patient',
                id: '42',
            }),
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
});
