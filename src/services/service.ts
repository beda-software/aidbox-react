import { AxiosRequestConfig } from 'axios';

import {
    failure,
    isFailure,
    isSuccess,
    isSuccessAll,
    RemoteDataResult,
    success,
    RemoteData,
    isFailureAny,
    isLoadingAny,
    loading,
    notAsked,
} from '../libs/remoteData';
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
): Promise<RemoteDataResult<R, F>>;
export async function applyDataTransformer<S = any, F = any, R = any>(
    servicePromise: Promise<RemoteData<S, F>>,
    transformer: (data: S) => R
): Promise<RemoteData<R, F>>;
export async function applyDataTransformer<S = any, F = any, R = any>(
    servicePromise: Promise<RemoteData<S, F>>,
    transformer: (data: S) => R
): Promise<RemoteData<R, F>> {
    const response = await servicePromise;
    return mapSuccess(response, transformer);
}

export async function applyErrorTransformer<S = any, F = any, R = any>(
    servicePromise: Promise<RemoteDataResult<S, F>>,
    transformer: (error: F) => R
): Promise<RemoteDataResult<S, R>>;
export async function applyErrorTransformer<S = any, F = any, R = any>(
    servicePromise: Promise<RemoteData<S, F>>,
    transformer: (error: F) => R
): Promise<RemoteData<S, R>>;
export async function applyErrorTransformer<S = any, F = any, R = any>(
    servicePromise: Promise<RemoteData<S, F>>,
    transformer: (error: F) => R
): Promise<RemoteData<S, R>> {
    const response = await servicePromise;
    return mapFailure(response, transformer);
}

export function mapSuccess<S = any, F = any, R = any>(
    remoteData: RemoteDataResult<S, F>,
    transformer: (data: S) => R
): RemoteDataResult<R, F>;
export function mapSuccess<S = any, F = any, R = any>(
    remoteData: RemoteData<S, F>,
    transformer: (data: S) => R
): RemoteData<R, F>;
export function mapSuccess<S = any, F = any, R = any>(
    remoteData: RemoteData<S, F>,
    transformer: (data: S) => R
): RemoteData<R, F> {
    if (isSuccess(remoteData)) {
        return success(transformer(remoteData.data));
    }

    return remoteData;
}

export function mapFailure<S = any, F = any, R = any>(
    remoteData: RemoteDataResult<S, F>,
    transformer: (error: F) => R
): RemoteDataResult<S, R>;
export function mapFailure<S = any, F = any, R = any>(
    remoteData: RemoteData<S, F>,
    transformer: (error: F) => R
): RemoteData<S, R>;
export function mapFailure<S = any, F = any, R = any>(
    remoteData: RemoteData<S, F>,
    transformer: (error: F) => R
): RemoteData<S, R> {
    if (isFailure(remoteData)) {
        return failure(transformer(remoteData.error));
    }

    return remoteData;
}

export type PromiseRemoteDataResultMap<T, F> = { [P in keyof T]: Promise<RemoteDataResult<T[P], F>> };
export type RemoteDataResultMap<T, F> = { [P in keyof T]: RemoteDataResult<T[P], F> };
export type PromiseRemoteDataMap<T, F> = { [P in keyof T]: Promise<RemoteData<T[P], F>> };
export type RemoteDataMap<T, F> = { [P in keyof T]: RemoteData<T[P], F> };

function createKeysMapTransformer<K = any>(keys: Array<K>) {
    return <S = any, R = any>(data: S): R =>
        keys.reduce((transformed, key, index) => {
            transformed[key] = data[index];
            return transformed;
        }, {} as any);
}

export function sequenceArray<T, F>(remoteDataArray: Array<RemoteDataResult<T, F>>): RemoteDataResult<T[], F[]>;
export function sequenceArray<T, F>(remoteDataArray: Array<RemoteData<T, F>>): RemoteData<T[], F[]>;
export function sequenceArray<T, F>(remoteDataArray: Array<RemoteData<T, F>>): RemoteData<T[], F[]> {
    if (isSuccessAll(remoteDataArray)) {
        return success(remoteDataArray.map((remoteDataResult) => remoteDataResult.data));
    }

    if (isFailureAny(remoteDataArray)) {
        return failure(
            remoteDataArray.reduce((accumulator, remoteDataResult: RemoteData<T, F>) => {
                if (isFailure(remoteDataResult)) {
                    accumulator.push(remoteDataResult.error);
                }
                return accumulator;
            }, [] as Array<F>)
        );
    }

    if (isLoadingAny(remoteDataArray)) {
        return loading;
    }

    return notAsked;
}

export function sequenceMap<I, F>(remoteDataMap: RemoteDataResultMap<I, F>): RemoteDataResult<I, F[]>;
export function sequenceMap<I, F>(remoteDataMap: RemoteDataMap<I, F>): RemoteData<I, F[]>;
export function sequenceMap<I, F>(remoteDataMap: RemoteDataMap<I, F>): RemoteData<I, F[]> {
    const keys = Object.keys(remoteDataMap);
    const remoteDataArray = Object.values(remoteDataMap) as Array<RemoteDataResult<any>>;

    return mapSuccess(sequenceArray(remoteDataArray), createKeysMapTransformer(keys));
}
export async function resolveArray<T, F>(
    promiseArray: Array<Promise<RemoteDataResult<T, F>>>
): Promise<RemoteDataResult<T[], F[]>>;
export async function resolveArray<T, F>(promiseArray: Array<Promise<RemoteData<T, F>>>): Promise<RemoteData<T[], F[]>>;
export async function resolveArray<T, F>(
    promiseArray: Array<Promise<RemoteData<T, F>>>
): Promise<RemoteData<T[], F[]>> {
    const remoteDataResults = (await Promise.all(promiseArray)) as Array<RemoteData<T, F>>;
    return sequenceArray(remoteDataResults);
}

export async function resolveMap<I, F>(promiseMap: PromiseRemoteDataResultMap<I, F>): Promise<RemoteDataResult<I, F[]>>;
export async function resolveMap<I, F>(promiseMap: PromiseRemoteDataMap<I, F>): Promise<RemoteData<I, F[]>>;
export async function resolveMap<I, F>(promiseMap: PromiseRemoteDataMap<I, F>): Promise<RemoteData<I, F[]>> {
    const keys = Object.keys(promiseMap);
    const remoteDataResults = (await Promise.all(Object.values(promiseMap))) as Array<RemoteDataResult<any>>;
    const result = mapSuccess(sequenceArray(remoteDataResults), createKeysMapTransformer(keys));

    return Promise.resolve(result);
}

export async function resolveServiceMap<I, F>(
    promiseMap: PromiseRemoteDataResultMap<I, F>
): Promise<RemoteDataResult<I, F[]>>;
export async function resolveServiceMap<I, F>(promiseMap: PromiseRemoteDataMap<I, F>): Promise<RemoteData<I, F[]>>;
export async function resolveServiceMap<I, F>(promiseMap: PromiseRemoteDataMap<I, F>): Promise<RemoteData<I, F[]>> {
    return resolveMap(promiseMap);
}
