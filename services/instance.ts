import axios from 'axios';

import { baseURL } from './constants';

export const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});
