import { 
    getFHIRResource, 
    getFHIRResources,
    patchFHIRResource,
    forceDeleteFHIRResource,
    deleteFHIRResource,
    getReference,
    makeReference,
    isReference,
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
