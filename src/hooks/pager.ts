import { useCallback, useMemo, useState } from 'react';
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
    const [pageToLoad, setPageToLoad] = useState((searchParams._page as number) ?? 1);
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

    const hasNext = useMemo(
        () => (isSuccess(resources) ? Boolean(resources.data.link?.some((link) => link.relation === 'next')) : false),
        [resources]
    );

    const hasPrevious = useMemo(
        () =>
            isSuccess(resources) ? Boolean(resources.data.link?.some((link) => link.relation === 'previous')) : false,
        [resources]
    );

    const loadNext = useCallback(() => setPageToLoad((currentPage) => currentPage + 1), []);

    const loadPrevious = useCallback(
        () => setPageToLoad((currentPage) => (hasPrevious ? currentPage - 1 : currentPage)),
        [hasPrevious]
    );

    const reload = useCallback(() => {
        setPageToLoad(1);
        setReloadsCount((c) => c + 1);
    }, []);

    return [
        resources,
        {
            loadNext,
            loadPrevious,
            loadPage: setPageToLoad,
            reload,
            hasNext,
            hasPrevious,
            currentPage: pageToLoad,
        },
    ];
}
