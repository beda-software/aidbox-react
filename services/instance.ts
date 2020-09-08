import axios from 'axios';
import { Token } from './token';

const flatten = (list: Array<any>): Array<any> =>
    list.reduce((a: Array<any>, b: any) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

const encodeEntry = (key: string, value: any) => encodeURIComponent(key) + '=' + encodeURIComponent(value);

const packEntry = (accumulator: Array<string>, [key, value]: any) => {
    if (typeof value === 'undefined') {
        return accumulator;
    }

    if (Array.isArray(value)) {
        value.forEach((value) => {
            accumulator.push(encodeEntry(key, Array.isArray(value) ? flatten(value) : value));
        });
    } else {
        accumulator.push(encodeEntry(key, value));
    }

    return accumulator;
};

export function buildQueryParams(params: Record<string, any>) {
    return Object.entries(params)
        .reduce(packEntry, [] as Array<string>)
        .join('&');
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
