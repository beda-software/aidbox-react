import axios from 'axios';
import _map from 'lodash/map';
import _flatMap from 'lodash/flatMap';
import _join from 'lodash/join';
import _reject from 'lodash/reject';
import _keys from 'lodash/keys';
import _concat from 'lodash/concat';
import _isUndefined from 'lodash/isUndefined';

import { Token } from './token';

export function buildQueryParams(params: object) {
    return _join(
        _flatMap(_keys(params), (k) =>
            _map(
                _reject(_concat([], params[k]), _isUndefined),
                // TODO: get rid of _has - wrong usage
                (v) => encodeURIComponent(k) + (k === '_has' ? ':' : '=') + encodeURIComponent(v)
            )
        ),
        '&'
    );
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
