import { act, renderHook } from '@testing-library/react-hooks';
import { Bundle } from 'src/contrib/aidbox';
import { usePager } from '../../hooks/pager';
import { useService } from '../../hooks/service';
import { success } from '../../libs/remoteData';
import { getFHIRResources } from '../../services/fhir';

jest.mock('../../services/fhir', () => ({ getFHIRResources: jest.fn() }));
jest.mock('../../hooks/service', () => ({ useService: jest.fn() }));

interface checkPageParameters {
    callNumber: number;
    pageNumber: number;
}

describe('Hook `usePager`', () => {
    const resourceType = 'Bundle';
    const resourcesOnPage = 2;

    const checkPage = (parameters: checkPageParameters) => {
        const { callNumber, pageNumber } = parameters;
        const [asyncFunction, [pageToLoad]] = (<jest.Mock>useService).mock.calls[callNumber];

        asyncFunction();

        const [fhirResourceType, fhirSearchParams] = (<jest.Mock>getFHIRResources).mock.calls[callNumber];

        expect(pageToLoad).toBe(pageNumber);
        expect(fhirSearchParams).toEqual({ _count: 2, _page: pageNumber });
        expect(fhirResourceType).toEqual(resourceType);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('property `hasNext`', () => {
        test("returns false when there's no next page", () => {
            const data = success({ resourceType });

            (<jest.Mock>useService).mockImplementation(() => [data]);

            const { result } = renderHook(() => usePager<Bundle<any>>('Bundle', resourcesOnPage));
            const [remoteData, { hasNext }] = result.current;

            expect(hasNext).toBeFalsy();
            expect(remoteData).toEqual(data);
        });

        test("returns true when there's next page", () => {
            const data = success({
                id: 'fakeID',
                resourceType,
                link: [
                    {
                        relation: 'first',
                        url: '/EpisodeOfCare?page=1',
                    },
                    {
                        relation: 'next',
                        url: '/EpisodeOfCare?page=2',
                    },
                    {
                        relation: 'self',
                        url: '/EpisodeOfCare?page=1',
                    },
                ],
            });

            (<jest.Mock>useService).mockImplementation(() => [data]);

            const { result } = renderHook(() => usePager<Bundle<any>>(resourceType, resourcesOnPage));
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

        const { result } = renderHook(() => usePager<Bundle<any>>(resourceType, resourcesOnPage));
        const { loadNext } = result.current[1];

        checkPage({ callNumber: 0, pageNumber: 1 });

        act(() => {
            loadNext();
        });

        checkPage({ callNumber: 1, pageNumber: 2 });
    });

    test('method `reload`', async () => {
        const data = success({
            id: 'fakeID',
            resourceType: 'type',
        });

        (<jest.Mock>useService).mockImplementation(() => [data]);

        const { result } = renderHook(() => usePager<Bundle<any>>(resourceType, resourcesOnPage));
        const { reload } = result.current[1];

        checkPage({ callNumber: 0, pageNumber: 1 });

        act(() => {
            reload();
        });

        checkPage({ callNumber: 1, pageNumber: 1 });
    });
});
