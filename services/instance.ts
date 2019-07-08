import axios from 'axios';

export const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

export function setInstanceBaseURL(baseURL: string) {
    axiosInstance.defaults.baseURL = baseURL;
}
