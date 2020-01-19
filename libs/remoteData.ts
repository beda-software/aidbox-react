enum Status {
    Success = 'Success',
    Failure = 'Failure',
    Loading = 'Loading',
    NotAsked = 'NotAsked',
}

interface RemoteDataNotAsked {
    status: Status.NotAsked;
}

export const notAsked: RemoteDataNotAsked = {
    status: Status.NotAsked,
};

interface RemoteDataLoading {
    status: Status.Loading;
}

export const loading: RemoteDataLoading = {
    status: Status.Loading,
};

interface RemoteDataSuccess<s> {
    status: Status.Success;
    data: s;
}

export function success<S = any>(data: S): RemoteDataSuccess<S> {
    return {
        status: Status.Success,
        data,
    };
}

interface RemoteDataFailure<F> {
    status: Status.Failure;
    error: F;
}

export function failure<F = any>(error: F): RemoteDataFailure<F> {
    return {
        status: Status.Failure,
        error,
    };
}

export type RemoteDataResult<S = any, F = any> = RemoteDataSuccess<S> | RemoteDataFailure<F>;
export type RemoteData<S = any, F = any> = RemoteDataNotAsked | RemoteDataLoading | RemoteDataResult<S, F>;

export function isNotAsked(remoteData: RemoteData): remoteData is RemoteDataNotAsked {
    return remoteData.status === Status.NotAsked;
}

export function isLoading(remoteData: RemoteData): remoteData is RemoteDataLoading {
    return remoteData.status === Status.Loading;
}

export function isSuccess<S>(remoteData: RemoteData<S>): remoteData is RemoteDataSuccess<S> {
    return remoteData.status === Status.Success;
}

export function isSuccessAll<S>(responses: Array<RemoteData<S>>): responses is Array<RemoteDataSuccess<S>> {
    return responses.every(isSuccess);
}

export function isFailure<F>(remoteData: RemoteData<any, F>): remoteData is RemoteDataFailure<F> {
    return remoteData.status === Status.Failure;
}
