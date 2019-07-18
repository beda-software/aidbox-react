import { AxiosRequestConfig } from 'axios';

import { RemoteDataResult, failure, success } from '../libs/remoteData';
import { axiosInstance } from './instance';

export async function service<S = any, F = any>(config: AxiosRequestConfig): Promise<RemoteDataResult<S, F>> {
    try {
        const response = await axiosInstance(config);

        return success(response.data);
    } catch (err) {
        return failure(err.response ? err.response.data : err.message);
    }
}
