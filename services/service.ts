import { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import { failure, isFailure, isSuccess, isSuccessAll, RemoteDataResult, success } from '../libs/remoteData';
import { axiosInstance } from './instance';

export async function service<S = any, F = any>(config: AxiosRequestConfig): Promise<RemoteDataResult<S, F>> {
    try {
        const response = await axiosInstance(config);

        return success(response.data);
    } catch (err) {
        return failure(err.response ? err.response.data : err.message);
    }
}

export async function applyDataTransformer<S = any, F = any, R = any>(
    servicePromise: Promise<RemoteDataResult<S, F>>,
    transformer: (data: S) => R
): Promise<RemoteDataResult<R, F>> {
    const response = await servicePromise;
    return mapSuccess(response, transformer);
}

export async function applyErrorTransformer<S = any, F = any, R = any>(
    servicePromise: Promise<RemoteDataResult<S, F>>,
    transformer: (error: F) => R
): Promise<RemoteDataResult<S, R>> {
    const response = await servicePromise;
    return mapFailure(response, transformer);
}

export function mapSuccess<S = any, F = any, R = any>(
    remoteData: RemoteDataResult<S, F>,
    transformer: (data: S) => R
): RemoteDataResult<R, F> {
    if (isSuccess(remoteData)) {
        return success(transformer(remoteData.data));
    }

    return remoteData;
}

export function mapFailure<S = any, F = any, R = any>(
    remoteData: RemoteDataResult<S, F>,
    transformer: (error: F) => R
): RemoteDataResult<S, R> {
    if (isFailure(remoteData)) {
        return failure(transformer(remoteData.error));
    }

    return remoteData;
}

export type PromiseRemoteDataResultMap<T, F> = { [P in keyof T]: Promise<RemoteDataResult<T[P], F>> };
export type RemoteDataResultMap<T, F> = { [P in keyof T]: RemoteDataResult<T[P], F> };

function createKeysMapTransformer<K = any>(keys: Array<K>) {
    return <S = any, R = any>(data: S): R =>
        keys.reduce((transformed, key, index) => {
            transformed[key] = data[index];
            return transformed;
        }, {} as any);
}

export function sequenceArray<T, F>(remoteDataArray: Array<RemoteDataResult<T, F>>): RemoteDataResult<T[], F[]> {
    if (isSuccessAll(remoteDataArray)) {
        return success(_.map(remoteDataArray, (remoteDataResult) => remoteDataResult.data));
    }

    return failure(
        _.compact(
            _.map(remoteDataArray, (remoteDataResult) =>
                isFailure(remoteDataResult) ? remoteDataResult.error : undefined
            )
        )
    );
}

export function sequenceMap<I, F>(remoteDataMap: RemoteDataResultMap<I, F>): RemoteDataResult<I, F[]> {
    const keys = Object.keys(remoteDataMap);
    const remoteDataArray = Object.values(remoteDataMap) as Array<RemoteDataResult<any>>;

    return mapSuccess(sequenceArray(remoteDataArray), createKeysMapTransformer(keys));
}

export async function resolveArray<T, F>(
    promiseArray: Array<Promise<RemoteDataResult<T, F>>>
): Promise<RemoteDataResult<T[], F[]>> {
    const remoteDataResults = (await Promise.all(promiseArray)) as Array<RemoteDataResult<T, F>>;

    return sequenceArray(remoteDataResults);
}

export async function resolveMap<I, F>(
    promiseMap: PromiseRemoteDataResultMap<I, F>
): Promise<RemoteDataResult<I, F[]>> {
    const keys = Object.keys(promiseMap);
    const remoteDataResults = (await Promise.all(Object.values(promiseMap))) as Array<RemoteDataResult<any>>;
    const result = mapSuccess(sequenceArray(remoteDataResults), createKeysMapTransformer(keys));

    return Promise.resolve(result);
}

export async function resolveServiceMap<I, F>(
    promiseMap: PromiseRemoteDataResultMap<I, F>
): Promise<RemoteDataResult<I, F[]>> {
    return resolveMap(promiseMap);
}
