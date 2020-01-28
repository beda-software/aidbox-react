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

export function resolveDataResults<T, F>(remoteDataResults: Array<RemoteDataResult<T, F>>): RemoteDataResult<T[], F[]> {
    if (isSuccessAll(remoteDataResults)) {
        return success(_.map(remoteDataResults, (remoteDataResult) => remoteDataResult.data));
    }

    return failure(
        _.compact(
            _.map(remoteDataResults, (remoteDataResult) =>
                isFailure(remoteDataResult) ? remoteDataResult.error : undefined
            )
        )
    );
}

export async function resolveDataResultPromises<T, F>(
    remoteDataResultPromises: Array<Promise<RemoteDataResult<T, F>>>
): Promise<RemoteDataResult<T[], F[]>> {
    const remoteDataResults = (await Promise.all(remoteDataResultPromises)) as Array<RemoteDataResult<T, F>>;

    return resolveDataResults(remoteDataResults);
}

export async function resolveServiceMap<I, F>(
    promisesMap: PromiseRemoteDataResultMap<I, F>
): Promise<RemoteDataResult<I, F[]>> {
    const keys = Object.keys(promisesMap);
    const responses = (await Promise.all(Object.values(promisesMap))) as Array<RemoteDataResult<any>>;

    const result = <any>mapSuccess(resolveDataResults(responses), (responseData) =>
        keys.reduce((transformed, key, index) => {
            (transformed[key] = responseData[index]), transformed;
            return transformed;
        }, {})
    );

    return Promise.resolve(result);
}
