import { act, renderHook } from '@testing-library/react-hooks';
import { Bundle } from 'shared/src/contrib/aidbox';

import { usePager } from '../../src/hooks/pager';
import { useService } from '../../src/hooks/service';
import { success } from '../../src/libs/remoteData';
import { getFHIRResources } from '../../src/services/fhir';
import { SearchParams } from '../../src/services/search';

jest.mock('../../src/services/fhir', () => ({ getFHIRResources: jest.fn() }));
jest.mock('../../src/hooks/service', () => ({ useService: jest.fn() }));

interface CheckPageParameters {
    callNumber: number;
    pageNumber: number;
    searchParams?: SearchParams;
}

describe('Hook `usePager`', () => {
    const resourceType = 'Bundle';
    const resourcesOnPage = 2;

    const checkPage = (parameters: CheckPageParameters) => {
        const { callNumber, pageNumber, searchParams = {} } = parameters;
        const [asyncFunction, [pageToLoad]] = (<jest.Mock>useService).mock.calls[callNumber];

        asyncFunction();

        const [fhirResourceType, fhirSearchParams] = (<jest.Mock>getFHIRResources).mock.calls[callNumber];
        expect(pageToLoad).toBe(pageNumber);
        expect(fhirSearchParams).toEqual({ ...searchParams, _count: resourcesOnPage, _page: pageNumber });
        expect(fhirResourceType).toEqual(resourceType);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('property `hasNext`', () => {
        test("returns false when there's no next page", () => {
            const data = success({ resourceType });

            (<jest.Mock>useService).mockImplementation(() => [data]);

            const { result } = renderHook(() => usePager<Bundle<any>>('Bundle'));
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

    describe('property `hasPrevious`', () => {
        test("returns false when there's no previous page", () => {
            const data = success({ resourceType });

            (<jest.Mock>useService).mockImplementation(() => [data]);

            const { result } = renderHook(() => usePager<Bundle<any>>('Bundle'));
            const [remoteData, { hasPrevious }] = result.current;

            expect(hasPrevious).toBeFalsy();
            expect(remoteData).toEqual(data);
        });

        test("returns true when there's previous page", () => {
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
                        url: '/EpisodeOfCare?page=3',
                    },
                    {
                        relation: 'self',
                        url: '/EpisodeOfCare?page=2',
                    },
                    {
                        relation: 'previous',
                        url: '/EpisodeOfCare?page=1',
                    },
                ],
            });

            (<jest.Mock>useService).mockImplementation(() => [data]);

            const { result } = renderHook(() => usePager<Bundle<any>>(resourceType, resourcesOnPage, { _page: 2 }));
            const [remoteData, { hasPrevious }] = result.current;

            expect(hasPrevious).toBeTruthy();
            expect(remoteData).toEqual(data);
        });
    });

    test('method `loadNext`', async () => {
        const data = success({
            id: 'fakeID',
            resourceType: 'type',
        });

        const searchParams = { a: 1, b: 2 };

        (<jest.Mock>useService).mockImplementation(() => [data]);

        const { result } = renderHook(() => usePager<Bundle<any>>(resourceType, resourcesOnPage, searchParams));
        const {
            current: [, { loadNext }],
        } = result;

        checkPage({ callNumber: 0, pageNumber: 1, searchParams });

        act(() => {
            loadNext();
        });

        checkPage({ callNumber: 1, pageNumber: 2, searchParams });
    });

    test('method `loadPrevious`', async () => {
        const data = success({
            id: 'fakeID',
            resourceType: 'type',
            link: [
                {
                    relation: 'first',
                    url: '/EpisodeOfCare?page=1',
                },
                {
                    relation: 'next',
                    url: '/EpisodeOfCare?page=3',
                },
                {
                    relation: 'self',
                    url: '/EpisodeOfCare?page=2',
                },
                {
                    relation: 'previous',
                    url: '/EpisodeOfCare?page=1',
                },
            ],
        });

        const searchParams = { _page: 2 };

        (<jest.Mock>useService).mockImplementation(() => [data]);

        const { result } = renderHook(() => usePager<Bundle<any>>(resourceType, resourcesOnPage, searchParams));
        const {
            current: [, { loadPrevious }],
        } = result;

        checkPage({ callNumber: 0, pageNumber: 2, searchParams });

        act(() => {
            loadPrevious();
        });

        checkPage({ callNumber: 1, pageNumber: 1, searchParams });
    });

    test('method `loadPage`', async () => {
        const data = success({
            id: 'fakeID',
            resourceType: 'type',
            link: [
                {
                    relation: 'first',
                    url: '/EpisodeOfCare?_page=1',
                },
                {
                    relation: 'self',
                    url: '/EpisodeOfCare?_page=1',
                },
                {
                    relation: 'next',
                    url: '/EpisodeOfCare?_page=2',
                },
                {
                    relation: 'last',
                    url: '/EpisodeOfCare?_page=6',
                },
            ],
        });

        (<jest.Mock>useService).mockImplementation(() => [data]);

        const { result } = renderHook(() => usePager<Bundle<any>>(resourceType, resourcesOnPage));
        const {
            current: [, { loadPage }],
        } = result;

        checkPage({ callNumber: 0, pageNumber: 1 });

        act(() => {
            loadPage(3);
        });

        checkPage({ callNumber: 1, pageNumber: 3 });
    });

    test('method `reload`', async () => {
        const data = success({
            id: 'fakeID',
            resourceType: 'type',
        });
        const searchParams = { a: 1, b: 2 };

        (<jest.Mock>useService).mockImplementation(() => [data]);

        const { result } = renderHook(() => usePager<Bundle<any>>(resourceType, resourcesOnPage, searchParams));
        const {
            current: [, { reload }],
        } = result;

        checkPage({ callNumber: 0, pageNumber: 1, searchParams });

        act(() => {
            reload();
        });

        checkPage({ callNumber: 1, pageNumber: 1, searchParams });
    });
});
