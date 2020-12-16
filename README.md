# aidbox-react

[![Build Status](https://travis-ci.org/beda-software/aidbox-react.svg?branch=master)](https://travis-ci.org/beda-software/aidbox-react) [![Coverage Status](https://coveralls.io/repos/github/beda-software/aidbox-react/badge.svg?branch=master)](https://coveralls.io/github/beda-software/aidbox-react?branch=master)

# Install

Clone this repository into `src/contrib/aidbox-react`
and provide type definitions for aidbox in `src/contrib/aidbox`

# Content

We consider service as a function that returns `RemoteDataResult<S, F>` (`RemoteDataSuccess<S> | RemoteDataSuccess<F>`). For details, see `RemoteData` interface in `aidbox-react/libs/remoteData.ts`

## Available services

-   service({...axiosConfig})
-   FHIR-specific:
    -   getFHIRResource(reference)
    -   findFHIRResource(resourceType, params)
    -   getFHIRResources(resourceType, params)
    -   saveFHIRResource(resource)
    -   saveFHIRResources(resources, bundleType)
    -   deleteFHIRResource(resources)

## Available hooks

-   useService(serviceFn)
-   usePager(resourceType, resourcesOnPage?, searchParams?)
-   useCRUD(resourceType, id?, getOrCreate?, defaultResource?) - WIP

# Usage

Set baseURL and token for axios instance using `setInstanceBaseURL` and `setInstanceToken/resetInstanceToken` from `aidbox-react/services/instance`
And use hooks and services

# Examples

## Pager hook

```typescript jsx
import * as React from 'react';

import { User } from 'shared/src/contrib/aidbox';
import { usePager } from 'src/contrib/aidbox-react/services/service';
import { isLoading, isSuccess } from 'src/contrib/aidbox-react/libs/remoteData';
import { extractBundleResources } from 'src/contrib/aidbox-react/services/fhir';

export function UserList(props: {}) {
    const [resourcesResponse, pagerManager] = usePager<User>('User', 2);

    if (isLoading(resourcesResponse)) {
        return <div>Loading...</div>;
    }

    if (isSuccess(resourcesResponse)) {
        const users = extractBundleResources(resourcesResponse.data).User || [];

        return (
            <div>
                <a onClick={() => pagerManager.loadNext()}>Load next</a>

                {users.map((user) => (
                    <div key={user.id}>{user.id}</div>
                ))}
            </div>
        );
    }

    return null;
}
```

## CRUD hook

```typescript jsx
import * as React from 'react';

import { useCRUD } from 'src/contrib/aidbox-react/hooks/crud';
import { isLoading, isSuccess } from 'src/contrib/aidbox-react/libs/remoteData';
import { Patient } from 'shared/src/contrib/aidbox';

export function UserList(props: {}) {
    const [resourceResponse, crudManager] = useCRUD<Patient>('Patient', 'toggle', true, {
        resourceType: 'Patient',
        active: false,
    });

    if (isLoading(resourceResponse)) {
        return <div>Loading...</div>;
    }

    if (isSuccess(resourceResponse)) {
        // This is just an example
        const active = resourceResponse.data.active;

        return (
            <div>
                Active: {active ? 'Yes' : 'No'}
                <a
                    onClick={() =>
                        crudManager.handleSave({
                            ...resourceResponse.data,
                            active: !active,
                        })
                    }
                >
                    Toggle
                </a>
            </div>
        );
    }
    return null;
}
```
