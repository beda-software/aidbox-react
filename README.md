# aidbox-react

[![Build Status](https://travis-ci.org/beda-software/aidbox-react.svg?branch=master)](https://travis-ci.org/beda-software/aidbox-react) [![Coverage Status](https://coveralls.io/repos/github/beda-software/aidbox-react/badge.svg?branch=master)](https://coveralls.io/github/beda-software/aidbox-react?branch=master)

TypeScript library consisting of set of utils, functions and [React hooks](https://reactjs.org/docs/hooks-intro.html) to work with Aidbox's [FHIR API](http://hl7.org/fhir/). Based on [axios](https://github.com/axios/axios).

So basically it is a javascript/typescript Aidbox FHIR-client.
The main difference between FHIR and Aidbox data structure in our case is Reference's format. Aidbox uses two separate fields: `resourceType` and `id` while FHIR uses `resourceType/id`. [Read more](https://docs.aidbox.app/basic-concepts/aidbox-and-fhir-formats)

# Install

Clone this repository into `src/contrib/aidbox-react`
and provide type definitions for aidbox in `src/contrib/aidbox` (see example/basic set of [Aidbox typings](https://github.com/beda-software/aidbox-react/blob/master/typings/contrib/aidbox.d.ts))

# Introduction

## RemoteData
[RemoteData](https://github.com/beda-software/aidbox-react/blob/master/src/libs/remoteData.ts) is a wrapper over data.

It could have four statuses:
* Success
* Failure
* Loading
* NotAsked

RemoteDataResult is a subset of RemoteData and it could have two statuses:
* Success
* Failure

When we make a request to a server with any of library's methods, we'll probably get RemoteData as a result. Then we can easily check what've got.

<details>
<summary>Simplified example</summary>

```TypeScript
import React from 'react';
// Your Aidbox typings. Read above in Install section of this Readme
import { Patient } from 'contrib/aidbox';  
import { getFHIRResource } from 'aidbox-react/lib/services/fhir';
import { isFailure, isSuccess } from 'aidbox-react/lib/libs/remoteData';

async function loadPatientGender() {
    const patientResponse = await getFHIRResource<Patient>({
        resourceType: 'Patient',
        id: 'patient-id',
    });
    if (isSuccess(patientResponse)) {
        return `Patient name is ${patientResponse.data.gender ?? 'unknown'}`;
    }
    if (isFailure(patientResponse)) {
        return `
            Failed to request patient,
            status: ${patientResponse.status},
            error : ${patientResponse.error}
        `;
    }
}
```
</details>

##
# Content

We consider service as a function that returns `RemoteDataResult<S, F>` (`RemoteDataSuccess<S> | RemoteDataSuccess<F>`). For details, see `RemoteData` interface in `aidbox-react/libs/remoteData.ts`

## Available functions (services)

-   service({...axiosConfig})
-   FHIR-specific:
    -   getFHIRResource(reference)
    -   getFHIRResources(resourceType, params)
    -   getAllFHIRResources(resourceType, params)
    -   findFHIRResource(resourceType, params)
    -   saveFHIRResource(resource)
    -   createFHIRResource(resource)
    -   updateFHIRResource(resource, params)
    -   patchFHIRResource(resource, params)
    -   saveFHIRResources(resources, bundleType)
    -   deleteFHIRResource(resources)
    -   forceDeleteFHIRResource(resource)

### service({...axiosConfig})
Basic function for making requests.

```TypeScript
import { service } from 'aidbox-react/lib/services/service';
import { formatError } from 'aidbox-react/lib/utils/error';
import { isFailure, isSuccess } from 'aidbox-react/lib/libs/remoteData';

async function deleteAccount() {
    const result = await service({
        url: '/User/$delete-account',
        method: 'POST',
    });
    if (isSuccess(result)) {
        await logout();
    } else if (isFailure(result)) {
        console.error(formatError(result.error));
    }
}
```

### getFHIRResource
Get resource by reference (resource type and id).

```TypeScript
import { getFHIRResource } from 'aidbox-react/lib/services/fhir';
// ...

const observationResponse = await getFHIRResource<Observation>(makeReference('Observation', 'observation-id'));
```

### getFHIRResources
Get resources using [Search API](https://www.hl7.org/fhir/search.html)
Returns only first page of resources.

```TypeScript
import { getFHIRResources } from 'aidbox-react/lib/services/fhir';
// ...

const qrBundleResponse = await getFHIRResources<QuestionnaireResponse>('QuestionnaireResponse', {
    subject: subject.id,
    questionnaire: 'intake',
    status: 'completed',
});
if (isSuccess(qrBundleResponse)) {
    // Iterate over found resources
    qrBundleResponse.data.entry?.forEach((bundleEntry) => {
        console.log(bundleEntry.resource?.status);
    });
}
```

### getAllFHIRResources
Get all found resources from all pages.

```TypeScript
import moment from 'moment';
import { getAllFHIRResources } from 'aidbox-react/lib/services/fhir';
import { formatFHIRDateTime } from 'aidbox-react/lib/utils/date';
// ...

const observationsResponse = await getAllFHIRResources<Observation>('Observation', {
    _sort: '-date',
    _count: 500,
    patient: 'patient-id',
    status: 'final',
    date: [`ge${formatFHIRDateTime(moment())}`],
});
```

### findFHIRResource
Uses [Search API](https://www.hl7.org/fhir/search.html) to find exactly one resource and return in (not bundle). It throws `Error('Too many resources found')` if more than one resources were found and `Error('No resources found')` if nothing were found.

<!-- TODO: Add try/catch example? -->
```TypeScript
import { findFHIRResource } from 'aidbox-react/lib/services/fhir';

const roleResponse = await findFHIRResource<PractitionerRole>('PractitionerRole', {
    practitioner: 'practitioner-id',
});
```

### saveFHIRResource
Saves resource. If resource has `id` – uses `PUT` method (updates), otherwise `POST` (creates).
If you want to have more control, you can use `createFHIRResource` or `updateFHIRResource` functions.

```TypeScript
import { saveFHIRResource } from 'aidbox-react/lib/services/fhir';
// ...

const saveResponse = await saveFHIRResource({
    resourceType: 'Patient',
    gender: 'female',
});

if (isFailure(saveResponse)) {
    console.warn('Can not create a patient: ', JSON.stringify(saveResponse.error));
}
```

## Available hooks

-   useService(serviceFn)
-   usePager(resourceType, resourcesOnPage?, searchParams?)
-   useCRUD(resourceType, id?, getOrCreate?, defaultResource?) - WIP

# Usage

Set baseURL and token for axios instance using `setInstanceBaseURL` and `setInstanceToken/resetInstanceToken` from `aidbox-react/services/instance`
And use hooks and services

# Examples

## Pager hook

```TSX
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

```TSX
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
