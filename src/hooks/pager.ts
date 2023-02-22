import { useCallback, useState } from 'react';
import { AidboxResource, Bundle } from 'shared/src/contrib/aidbox';

import { isSuccess, RemoteData } from '../libs/remoteData';
import { getFHIRResources } from '../services/fhir';
import { SearchParams } from '../services/search';
import { useService } from './service';

export interface PagerManager {
    loadNext: () => void;
    loadPrevious: () => void;
    loadPage: (page: number) => void;
    reload: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
    currentPage: number;
}

export function usePager<T extends AidboxResource>(
    resourceType: T['resourceType'],
    resourcesOnPage: number = 15,
    searchParams: SearchParams = {}
): [RemoteData<Bundle<T>>, PagerManager] {
    const [pageToLoad, setPageToLoad] = useState(searchParams._page ? Number(searchParams._page) : 1);
    const [reloadsCount, setReloadsCount] = useState(0);
    const [resources] = useService(
        () =>
            getFHIRResources(resourceType, {
                ...searchParams,
                _count: resourcesOnPage,
                _page: pageToLoad,
            }),
        [pageToLoad, reloadsCount, resourcesOnPage]
    );

    const loadNext = useCallback(() => setPageToLoad((currentPage) => currentPage + 1), []);

    const loadPrevious = useCallback(() => setPageToLoad((currentPage) => currentPage - 1), []);

    const loadPage = useCallback((page: number) => setPageToLoad(page), []);

    const reload = useCallback(() => {
        setPageToLoad(1);
        setReloadsCount((c) => c + 1);
    }, []);

    const hasNext =
        isSuccess(resources) &&
        Boolean(resources.data.link && resources.data.link.some((link) => link.relation === 'next'));

    const hasPrevious =
        isSuccess(resources) &&
        Boolean(resources.data.link && resources.data.link.some((link) => link.relation === 'previous'));

    return [
        resources,
        {
            loadNext,
            loadPrevious,
            loadPage,
            hasNext,
            hasPrevious,
            reload,
            currentPage: pageToLoad,
        },
    ];
}
