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

    if (isSuccess(response)) {
        return success(transformer(response.data));
    }

    return response;
}

export async function applyErrorTransformer<S = any, F = any, R = any>(
    servicePromise: Promise<RemoteDataResult<S, F>>,
    transformer: (error: F) => R
): Promise<RemoteDataResult<S, R>> {
    const response = await servicePromise;

    if (isFailure(response)) {
        return failure(transformer(response.error));
    }

    return response;
}

type PromiseRemoteDataResultMap<T, F> = { [P in keyof T]: Promise<RemoteDataResult<T[P], F>> };
export async function resolveServiceMap<I, F>(
    promisesMap: PromiseRemoteDataResultMap<I, F>
): Promise<RemoteDataResult<I, F[]>> {
    const keys = _.keys(promisesMap);
    const values = _.values(promisesMap);

    const responses = (await Promise.all(values)) as Array<RemoteDataResult<any>>;

    if (isSuccessAll(responses)) {
        return success(_.zipObject(keys, _.map(responses, (response) => response.data)) as I);
    } else {
        return failure(_.compact(
            _.map(responses, (response) => (isFailure(response) ? response.error : undefined))
        ));
    }
}
