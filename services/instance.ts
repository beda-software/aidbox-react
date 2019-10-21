import axios from 'axios';
import _ from 'lodash';

import { Token } from './token';

export function buildQueryParams(params: object) {
    return _.chain(params)
        .keys()
        .flatMap((k) =>
            _.map(
                [].concat(params[k]),
                (v) => encodeURIComponent(k) + (k === '_has' ? ':' : '=') + encodeURIComponent(v)
            )
        )
        .join('&')
        .value();
}

export const axiosInstance = axios.create({
    paramsSerializer: buildQueryParams,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
    },
});

export function setInstanceBaseURL(baseURL: string) {
    axiosInstance.defaults.baseURL = baseURL;
}

export function setInstanceToken(token: Token) {
    axiosInstance.defaults.headers.Authorization = `Bearer ${token.access_token}`;
}

export function resetInstanceToken() {
    delete axiosInstance.defaults.headers.Authorization;
}
