import { act, renderHook } from '@testing-library/react-hooks';
import { User } from 'src/contrib/aidbox';
import { usePager } from '../../hooks/pager';
import { useService } from '../../hooks/service';
import { success } from '../../libs/remoteData';
import { getFHIRResources } from '../../services/fhir';

jest.mock('../../services/fhir', () => ({ getFHIRResources: jest.fn() }));
jest.mock('../../hooks/service', () => ({ useService: jest.fn() }));

describe('Hook `usePager`', () => {
    const resourceType = 'User';
    const resourcesOnPage = 2;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('property `hasNext`', () => {
        test("returns false when there's no next page", () => {
            const data = success({
                id: 'fakeID',
                resourceType: 'type',
            });

            (<jest.Mock>useService).mockImplementation(() => [data]);

            const { result } = renderHook(() => usePager<User>(resourceType, resourcesOnPage));
            const [remoteData, { hasNext }] = result.current;

            expect(hasNext).toBeFalsy();
            expect(remoteData).toEqual(data);
        });

        test("returns true when there's next page", () => {
            const data = success({
                id: 'fakeID',
                resourceType: 'type',
                link: [
                    {
                        resourceType: 'Bundle',
                        relation: 'next',
                        uri: 'uri',
                    },
                ],
            });

            (<jest.Mock>useService).mockImplementation(() => [data]);

            const { result } = renderHook(() => usePager<User>(resourceType, resourcesOnPage));
            const [remoteData, { hasNext }] = result.current;

            expect(hasNext).toBeTruthy();
            expect(remoteData).toEqual(data);
        });
    });

    test('method `loadNext`', async () => {
        const data = success({
            id: 'fakeID',
            resourceType: 'type',
        });

        (<jest.Mock>useService).mockImplementation(() => [data]);

        const { result } = renderHook(() => usePager<User>(resourceType, resourcesOnPage));
        const { loadNext } = result.current[1];

        {
            let [asyncFunction, [pageToLoad]] = (<jest.Mock>useService).mock.calls[0];

            asyncFunction();

            let [fhirResourceType, fhirSearchParams] = (<jest.Mock>getFHIRResources).mock.calls[0];

            expect(pageToLoad).toBe(1);
            expect(fhirSearchParams).toEqual({ _count: 2, _page: 1 });
            expect(fhirResourceType).toEqual(resourceType);
        }

        act(() => {
            loadNext();
        });

        {
            let [asyncFunction, [pageToLoad]] = (<jest.Mock>useService).mock.calls[1];

            asyncFunction();

            let [fhirResourceType, fhirSearchParams] = (<jest.Mock>getFHIRResources).mock.calls[1];

            expect(pageToLoad).toBe(2);
            expect(fhirSearchParams).toEqual({ _count: 2, _page: 2 });
            expect(fhirResourceType).toEqual(resourceType);
        }
    });

    test('method `reload`', async () => {
        const data = success({
            id: 'fakeID',
            resourceType: 'type',
        });

        (<jest.Mock>useService).mockImplementation(() => [data]);

        const { result } = renderHook(() => usePager<User>(resourceType, resourcesOnPage));
        const { reload } = result.current[1];

        {
            let [asyncFunction, [pageToLoad, reloadsCount]] = (<jest.Mock>useService).mock.calls[0];

            asyncFunction();

            let [fhirResourceType, fhirSearchParams] = (<jest.Mock>getFHIRResources).mock.calls[0];

            expect(pageToLoad).toBe(1);
            expect(reloadsCount).toBe(0);
            expect(fhirSearchParams).toEqual({ _count: 2, _page: 1 });
            expect(fhirResourceType).toEqual(resourceType);
        }

        act(() => {
            reload();
        });

        {
            let [asyncFunction, [pageToLoad, reloadsCount]] = (<jest.Mock>useService).mock.calls[1];

            asyncFunction();

            let [fhirResourceType, fhirSearchParams] = (<jest.Mock>getFHIRResources).mock.calls[1];

            expect(pageToLoad).toBe(1);
            expect(reloadsCount).toBe(1);
            expect(fhirSearchParams).toEqual({ _count: 2, _page: 1 });
            expect(fhirResourceType).toEqual(resourceType);
        }
    });
});
