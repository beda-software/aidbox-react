import {
    getFHIRResource,
    getFHIRResources,
    findFHIRResource,
    saveFHIRResource,
    saveFHIRResources,
    patchFHIRResource,
    forceDeleteFHIRResource,
    deleteFHIRResource,
    getReference,
    makeReference,
    isReference,
    extractBundleResources,
    getIncludedResource,
    getIncludedResources,
    getConcepts,
} from '../../services/fhir';

import { service } from '../../services/service';
import { success, failure } from '../../libs/remoteData';
import { Bundle, AidboxResource } from 'src/contrib/aidbox';

jest.mock('../../services/service', () => {
    return { service: jest.fn(() => Promise.resolve(success('data'))) };
});

describe('Service `fhir`', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('method `getFHIRResource`', async () => {
        const reference = {
            id: '1',
            resourceType: 'Patient',
        };

        await getFHIRResource(reference);

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'GET',
            url: '/' + reference.resourceType + '/' + reference.id,
        });
    });

    test('method `getFHIRResources`', async () => {
        const params = { id: 2 };

        await getFHIRResources('user', params);

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'GET',
            url: '/user',
            params,
        });

        await getFHIRResources('user', params, 'extra');

        expect((<jest.Mock>service).mock.calls[1][0]).toEqual({
            method: 'GET',
            url: '/user/extra',
            params,
        });
    });

    test('method `saveFHIRResource` 1', async () => {
        const resourceWithId = { id: '1', resourceType: 'Patient' };
        const resourceWithoutId = { resourceType: 'Patient' };

        saveFHIRResource(resourceWithId);

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'PUT',
            url: '/Patient/1',
            data: resourceWithId,
        });

        await saveFHIRResource(resourceWithoutId);

        expect((<jest.Mock>service).mock.calls[1][0]).toEqual({
            method: 'POST',
            url: '/Patient',
            data: resourceWithoutId,
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

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
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

    test('method `findFHIRResource`', async () => {
        const params = { id: 1 };
        const resourceType = 'Patient';

        await findFHIRResource(resourceType, params);

        const config = (<jest.Mock>service).mock.calls[0][0];

        expect(config).toEqual(
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
            config.transformResponse(response);
        }).toThrow();

        expect(() => {
            const response = '{"entry":[]}';
            config.transformResponse(response);
        }).toThrow();

        const response = '{"entry":[{"resource": "data"}]}';
        const transformed = config.transformResponse(response);

        expect(transformed).toBe('data');

        expect(() => {
            const response = '{"entry":[{"resource": "a"}, {"resource": "b"}]}';
            config.transformResponse(response);
        }).toThrow();
    });

    test('method `patchFHIRResource`', async () => {
        const resource = {
            id: '1',
            resourceType: 'Patient',
        };

        await patchFHIRResource(resource);

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'PATCH',
            data: resource,
            url: `/${resource.resourceType}/${resource.id}`,
        });
    });

    test('method `deleteFHIRResource`', async () => {
        const result = await deleteFHIRResource({
            id: '1',
            resourceType: 'Unknown',
        });

        expect(result).toEqual(failure({}));

        const resource = {
            id: '1',
            resourceType: 'Location',
        };

        await deleteFHIRResource(resource);

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'PATCH',
            url: `/${resource.resourceType}/${resource.id}`,
            data: {
                status: 'inactive',
            },
        });
    });

    test('method `forceDeleteFHIRResource`', async () => {
        const resource = {
            id: '1',
            resourceType: 'Patient',
        };
        const params = { id: 2 };

        await forceDeleteFHIRResource(resource, params);

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'DELETE',
            url: `/${resource.resourceType}/${resource.id}`,
            params,
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

    test('method `getIncludedResources`', () => {
        const customTypeResources = [1, 2, 3];
        const resourceType = 'customType';
        const resources = {
            customType: customTypeResources,
        };

        expect(getIncludedResources(resources, resourceType)).toEqual(customTypeResources);
    });

    test('method `getConcepts`', async () => {
        const valueSetId = '1';
        const params = {
            a: 1,
            b: 2,
        };

        await getConcepts(valueSetId, params);

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'GET',
            url: `/ValueSet/${valueSetId}/$expand`,
            params,
        });
    });
});
