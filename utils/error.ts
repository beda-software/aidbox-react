import { OperationOutcome } from 'src/contrib/aidbox';

interface BackendError {
    error: string;
    error_description: string;
}

type ErrorMapping = { [code: string]: string };

const baseErrorMapping = {
    network_error: 'Network Error',
    unknown: 'Unknown error',
} as const;

export function extractErrorCode(error: any) {
    if (error === 'Network Error') {
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

/**
 * Returns formatted error (when you need to display human-friendly error message)
 *
 * formatError(
 *     error,
 *     {'conflict': 'Please reload page'},
 *     (errorCode, errorDescription) => `An error occurred: ${errorDescription} (${errorCode}). Please reach tech support`
 * )
 */
export function formatError(
    error: any,
    mapping?: ErrorMapping,
    format?: (errorCode: string, errorDescription: string) => string
) {
    const extendedMapping = {
        // @ts-ignore
        ...baseErrorMapping,
        ...mapping,
    };

    const errorCode = extractErrorCode(error);

    if (errorCode in extendedMapping) {
        return extendedMapping[errorCode];
    }

    let errorDescription: string = baseErrorMapping.unknown;
    if (isOperationOutcome(error) && error.issue[0].details?.text) {
        errorDescription = error.issue[0].details?.text;
    }

    if (isBackendError(error) && error.error_description) {
        errorDescription = error.error_description;
    }

    if (format) {
        return format(errorCode, errorDescription);
    }

    return `${errorDescription} (${errorCode})`;
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
