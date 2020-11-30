import { OperationOutcome } from 'shared/lib/contrib/aidbox';

interface BackendError {
    error: string;
    error_description: string;
}

interface ErrorMapping {
    [code: string]: string;
}

interface FormatErrorConfig {
    mapping?: ErrorMapping;
    format?: (errorCode: string, errorDescription: string) => string;
}

// Mapping that describes default error codes such as network_error and unknown.
// These are both two edge cases: network error - when request has fallen due to problems with
// network (no internet connection, server is down) and unknown when
// response has no defined error code
const baseErrorMapping = {
    network_error: 'Network error',
    unknown: 'Unknown error',
} as const;

// Network error constant that axios returns in case if request failed
const axiosNetworkError = 'Network Error';

/**
 * Returns formatted error (when you need to display human-friendly error message)
 *
 * formatError(
 *     error,
 *     {
 *         mapping: {'conflict': 'Please reload page'},
 *         format: (errorCode, errorDescription) =>
 *             `An error occurred: ${errorDescription} (${errorCode}). Please reach tech support`
 *     }
 * )
 */
export function formatError(error: any, config: FormatErrorConfig = {}) {
    const { mapping, format } = config;
    const extendedMapping = {
        // @ts-ignore
        ...baseErrorMapping,
        ...mapping,
    };

    const errorCode = extractErrorCode(error);

    if (errorCode in extendedMapping) {
        return extendedMapping[errorCode];
    }

    const errorDescription = extractErrorDescription(error);

    if (format) {
        return format(errorCode, errorDescription);
    }

    return `${errorDescription} (${errorCode})`;
}

export function extractErrorDescription(error: any) {
    if (error === axiosNetworkError) {
        return baseErrorMapping.network_error;
    }

    if (isOperationOutcome(error) && error.issue[0].details?.text) {
        return error.issue[0].details?.text;
    }

    if (isBackendError(error) && error.error_description) {
        return error.error_description;
    }

    return baseErrorMapping.unknown;
}

export function extractErrorCode(error: any) {
    if (error === axiosNetworkError) {
        return 'network_error';
    }

    if (isOperationOutcome(error)) {
        return error.issue[0].code;
    }

    if (isBackendError(error)) {
        return error.error;
    }

    return 'unknown';
}

function isObject(value: any): value is Object {
    return value && typeof value === 'object' && !(value instanceof Array);
}

export function isOperationOutcome(error: any): error is OperationOutcome {
    return isObject(error) && error.resourceType === 'OperationOutcome';
}

export function isBackendError(error: any): error is BackendError {
    return isObject(error) && error.error;
}
