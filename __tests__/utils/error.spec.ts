import { isOperationOutcome, isBackendError, formatError } from '../../utils/error';

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

    describe('method `formatError` without args', () => {
        test('unknown error', () => {
            const error = 'Error';
            const result = `Unknown error`;

            expect(formatError(error)).toEqual(result);
        });

        test('network error', () => {
            const error = 'Network Error';
            const result = `Network Error`;

            expect(formatError(error)).toEqual(result);
        });

        test('OperationOutcome error', () => {
            const error = {
                resourceType: 'OperationOutcome',
                issue: [{ code: 'bad_login', details: { text: 'You have send bad login' } }],
            };
            const result = `You have send bad login`;

            expect(formatError(error)).toEqual(result);
        });

        test('BackendError error', () => {
            const error = {
                error: 'bad_login',
                error_description: 'You have send bad login',
            };
            const result = `You have send bad login`;

            expect(formatError(error)).toEqual(result);
        });

        test('unhandled error without description', () => {
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

            expect(formatError(error, mapping)).toEqual(result);
        });

        test('unhandled error without description', () => {
            const error = {
                error: 'aidbox_error',
            };
            const mapping = { aidbox_error: 'Something went wrong with aidbox' };
            const result = `Something went wrong with aidbox`;

            expect(formatError(error, mapping)).toEqual(result);
        });

        test('unknown error override', () => {
            const error = null;
            const mapping = { unknown: 'Something went wrong' };
            const result = `Something went wrong`;

            expect(formatError(error, mapping)).toEqual(result);
        });

        test('BackendError and unhandled error code', () => {
            const error = { error: 'bad_password', error_description: 'You have wrong password' };
            const mapping = { bad_login: 'Wrong login' };
            const result = `You have wrong password`;

            expect(formatError(error, mapping)).toEqual(result);
        });
    });

    describe('method `formatError` with unhandledError', () => {
        test('BackendError and unhandled error code', () => {
            const error = { error: 'bad_password', error_description: 'You have wrong password' };
            const mapping = { bad_login: 'Wrong login' };
            const unhandledError = (errorCode: string) => `Please contact support (${errorCode})`;
            const result = `Please contact support (bad_password)`;

            expect(formatError(error, mapping, unhandledError)).toEqual(result);
        });

        test('BackendError and handled error code', () => {
            const error = { error: 'bad_password', error_description: 'You have wrong password' };
            const mapping = { bad_password: 'Wrong password' };
            const unhandledError = (errorCode: string) => `Please contact support (${errorCode})`;
            const result = `Wrong password`;

            expect(formatError(error, mapping, unhandledError)).toEqual(result);
        });
    });
});
