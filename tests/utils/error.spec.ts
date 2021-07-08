import {
    isOperationOutcome,
    isBackendError,
    formatError,
    extractErrorDescription,
    extractErrorCode,
} from '../../src/utils/error';

describe('Util `tests`', () => {
    describe('method `isOperationOutcome`', () => {
        test('`OperationOutcome` error', () => {
            expect(isOperationOutcome({ resourceType: 'OperationOutcome' })).toBeTruthy();
        });

        test('not `OperationOutcome` error', () => {
            expect(isOperationOutcome(null)).toBeFalsy();
            expect(isOperationOutcome({})).toBeFalsy();
            expect(isOperationOutcome({ resourceType: 'unknown' })).toBeFalsy();
        });
    });

    describe('method `isBackendError`', () => {
        test('`BackendError` error', () => {
            expect(isBackendError({ error: 'bad_login' })).toBeTruthy();
        });

        test('not `BackendError` error', () => {
            expect(isBackendError(null)).toBeFalsy();
            expect(isBackendError({})).toBeFalsy();
            expect(isBackendError({ resourceType: 'unknown' })).toBeFalsy();
        });
    });

    describe('method `extractErrorCode`', () => {
        test('unknown error', () => {
            const error = null;
            const result = 'unknown';

            expect(extractErrorCode(error)).toEqual(result);
        });

        test('network error', () => {
            const error = 'Network Error';
            const result = 'network_error';

            expect(extractErrorCode(error)).toEqual(result);
        });

        test('BackendError', () => {
            const error = { error: 'code' };
            const result = 'code';

            expect(extractErrorCode(error)).toEqual(result);
        });

        test('OperationOutcome', () => {
            const error = { resourceType: 'OperationOutcome', issue: [{ code: 'code' }] };
            const result = 'code';

            expect(extractErrorCode(error)).toEqual(result);
        });
    });

    describe('method `extractErrorDescription`', () => {
        test('unknown error', () => {
            const error = null;
            const result = `Unknown error`;

            expect(extractErrorDescription(error)).toEqual(result);
        });

        test('network error', () => {
            const error = 'Network Error';
            const result = `Network error`;

            expect(extractErrorDescription(error)).toEqual(result);
        });

        test('BackendError', () => {
            const error = { error: 'code', error_description: 'Description' };
            const result = 'Description';

            expect(extractErrorDescription(error)).toEqual(result);
        });

        test('OperationOutcome details', () => {
            const error = {
                resourceType: 'OperationOutcome',
                issue: [{ code: 'code', details: { text: 'Description' } }],
            };
            const result = 'Description';

            expect(extractErrorDescription(error)).toEqual(result);
        });

        test('OperationOutcome diagnostics', () => {
            const error = {
                resourceType: 'OperationOutcome',
                issue: [{ code: 'code', diagnostics: 'Description' }],
            };
            const result = 'Description';

            expect(extractErrorDescription(error)).toEqual(result);
        });
    });

    describe('method `formatError` without config', () => {
        test('unknown error', () => {
            const error = null;
            const result = `Unknown error`;

            expect(formatError(error)).toEqual(result);
        });

        test('network error', () => {
            const error = 'Network Error';
            const result = `Network error`;

            expect(formatError(error)).toEqual(result);
        });

        test('OperationOutcome error', () => {
            const error = {
                resourceType: 'OperationOutcome',
                issue: [{ code: 'bad_login', details: { text: 'You have sent bad login' } }],
            };
            const result = `You have sent bad login (bad_login)`;

            expect(formatError(error)).toEqual(result);
        });

        test('BackendError error', () => {
            const error = {
                error: 'bad_login',
                error_description: 'You have sent bad login',
            };
            const result = `You have sent bad login (bad_login)`;

            expect(formatError(error)).toEqual(result);
        });

        test('error without description', () => {
            const error = {
                error: 'aidbox_error',
            };
            const result = `Unknown error (aidbox_error)`;

            expect(formatError(error)).toEqual(result);
        });
    });

    describe('method `formatError` with mapping', () => {
        test('BackendError error', () => {
            const error = {
                error: 'bad_login',
                error_description: 'You have send bad login',
            };
            const mapping = { bad_login: 'Bad login' };
            const result = 'Bad login';

            expect(formatError(error, { mapping })).toEqual(result);
        });

        test('default format error without description', () => {
            const error = {
                error: 'aidbox_error',
            };
            const mapping = { aidbox_error: 'Something went wrong with aidbox' };
            const result = `Something went wrong with aidbox`;

            expect(formatError(error, { mapping })).toEqual(result);
        });

        test('unknown error override', () => {
            const error = null;
            const mapping = { unknown: 'Something went wrong' };
            const result = `Something went wrong`;

            expect(formatError(error, { mapping })).toEqual(result);
        });

        test('BackendError and default error format', () => {
            const error = { error: 'bad_password', error_description: 'You have wrong password' };
            const mapping = { bad_login: 'Wrong login' };
            const result = `You have wrong password (bad_password)`;

            expect(formatError(error, { mapping })).toEqual(result);
        });
    });

    describe('method `formatError` with format', () => {
        test('BackendError with missing code in mapping', () => {
            const error = { error: 'bad_password', error_description: 'You have wrong password' };
            const mapping = { bad_login: 'Wrong login' };
            const format = (errorCode: string) => `Please contact support (${errorCode})`;
            const result = `Please contact support (bad_password)`;

            expect(formatError(error, { mapping, format })).toEqual(result);
        });

        test('BackendError and existing error code', () => {
            const error = { error: 'bad_password', error_description: 'You have wrong password' };
            const mapping = { bad_password: 'Wrong password' };
            const format = (errorCode: string) => `Please contact support (${errorCode})`;
            const result = `Wrong password`;

            expect(formatError(error, { mapping, format })).toEqual(result);
        });
    });
});
