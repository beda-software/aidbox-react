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
    getIncludedResource,
    getIncludedResources,
    getConcepts
} from '../../services/fhir';

import { service } from '../../services/service';
import { success, failure } from '../../libs/remoteData';


jest.mock('../../services/service', () => {
    return { service: jest.fn(() => Promise.resolve(success('data'))) }
})

describe('Service `fhir`', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('method `getFHIRResource`', async () => {
        const reference = {
            id: '1',
            resourceType: 'type'
        };

        await getFHIRResource(reference);

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'GET', 
            url: '/' + reference.resourceType  + '/' + reference.id
        });
    })

    test('method `getFHIRResources`', async () => {
        const params = { id: 2 };

        await getFHIRResources('user', params);

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'GET', 
            url: '/user', 
            params
        })

        await getFHIRResources('user', params, 'extra');

        expect((<jest.Mock>service).mock.calls[1][0]).toEqual({
            method: 'GET', 
            url: '/user/extra', 
            params
        })
    })

    test('method `saveFHIRResource` 1', async () => {
        const resourceWithId = { id: '1', resourceType: 'type' }
        const resourceWithoutId = { resourceType: 'type' }

        saveFHIRResource(resourceWithId)

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'PUT', 
            url: '/type/1', 
            data: resourceWithId
        })

        await saveFHIRResource(resourceWithoutId)

        expect((<jest.Mock>service).mock.calls[1][0]).toEqual({
            method: 'POST', 
            url: '/type', 
            data: resourceWithoutId
        })
    })

    test('method `saveFHIRResources`', async () => {
        const bundleType = 'transaction'
        const resources = [
            { id: '1', resourceType: 'type' },
            { id: '2', resourceType: 'type' },
            { resourceType: 'type' }
        ]

        await saveFHIRResources(resources, bundleType)

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'POST', 
            url: '/', 
            data: {
                type: bundleType,
                entry: [
                    {
                        request: {
                            method: "PUT",
                            url: "/type/1",
                        },
                        resource: {
                            id: '1', 
                            resourceType: 'type'
                        }
                    },
                    {
                        request: {
                            method: "PUT",
                            url: "/type/2",
                        },
                        resource: {
                            id: '2', 
                            resourceType: 'type'
                        }
                    },
                    {
                        request: {
                            method: "POST",
                            url: "/type",
                        },
                        resource: {
                            resourceType: 'type'
                        }
                    }
                ]
            }
        })
    })
    
    test('method `findFHIRResource`', async () => {
        const params = { id: 1 }
        const resourceType = 'type'

        await findFHIRResource(resourceType, params)

        const config = (<jest.Mock>service).mock.calls[0][0]

        expect(config).toEqual(expect.objectContaining({
            method: 'GET',
            url: '/' + resourceType,
            params
        }))

        expect(() => {
            const response = ''
            config.transformResponse(response)
         }).toThrow();

        expect(() => {
            const response = '{"entry":[]}'
            config.transformResponse(response)
         }).toThrow();

        const response = '{"entry":[{"resource": "data"}]}'
        const transformed = config.transformResponse(response)

        expect(transformed).toBe('data')

        expect(() => {
            const response = '{"entry":[{"resource": "a"}, {"resource": "b"}]}'
            config.transformResponse(response)
         }).toThrow();
    })

    test('method `patchFHIRResource`', async () => {
        const resource = { 
            id: '1',
            resourceType: 'type'
        }

        await patchFHIRResource(resource)

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'PATCH',
            data: resource,
            url: `/${resource.resourceType}/${resource.id}`,
        })
    })

    test('method `deleteFHIRResource`', async () => {
        const result = await deleteFHIRResource({ 
            id: '1',
            resourceType: 'Unknown'
        })

        expect(result).toEqual(failure({}))

        const resource = { 
            id: '1',
            resourceType: 'Location'
        }

        await deleteFHIRResource(resource)

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'PATCH',
            url: `/${resource.resourceType}/${resource.id}`,
            data: {
                'status': 'inactive',
            }
        })
    })

    test('method `forceDeleteFHIRResource`', async () => {
        const resource = { 
            id: '1',
            resourceType: 'type'
        }
        const params = { id: 2 };

        await forceDeleteFHIRResource(resource, params)

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'DELETE', 
            url: `/${resource.resourceType}/${resource.id}`,
            params
        })
    })

    test('method `getReference`', () => {
        const id = '1'
        const resourceType = 'type'
        const resource = { id, resourceType }

        expect(getReference(resource)).toEqual({ 
            id,
            resourceType 
        })

        expect(getReference(resource, 'value')).toEqual({ 
            id, 
            resourceType, 
            display: 'value'
        })
    })

    test('method `makeReference`', () => {
        const id = '1';
        const resourceType = 'type';

        expect(makeReference(resourceType, id)).toEqual({ id, resourceType })
    })

    test('method `isReference`', () => {
        expect(isReference({
            id: '1',
            resourceType: 'type',
        })).toBeTruthy()

        expect(isReference({
            id: '1',
            resourceType: 'type',
            extraField: true
        })).toBeFalsy()  
    })

    test('method `getIncludedResource` 1', () => {
        const resources = {
            customType: [
                { id: '1' }
            ],
        }

        const referenceFirst = { id: '1', resourceType: 'customType' }
        const referenceSecond = { id: '2', resourceType: 'customType' }

        expect(getIncludedResource(resources, referenceFirst)).toBeTruthy()
        expect(getIncludedResource(resources, referenceSecond)).toBeFalsy()
    })

    test('method `getIncludedResources`', () => {
        const customTypeResources = [1, 2, 3]
        const resourceType = 'customType'
        const resources = {
            customType: customTypeResources
        }

        expect(getIncludedResources(resources, resourceType)).toEqual(customTypeResources)
    })

    test('method `getConcepts`', async () => {
        const valueSetId = '1';
        const params = {
            a: 1,
            b: 2
        };

        await getConcepts(valueSetId, params)

        expect((<jest.Mock>service).mock.calls[0][0]).toEqual({
            method: 'GET', 
            url: `/ValueSet/${valueSetId}/$expand`,
            params
        })
    })
})
