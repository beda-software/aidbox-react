import { isOperationOutcome, isConflict, formatError } from '../../utils/error';
import { OperationOutcome } from 'src/contrib/aidbox';

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

    test('method `isConflict`', () => {
        const error: OperationOutcome = {
            resourceType: 'OperationOutcome',
            issue: [{ code: 'conflict' }],
        };

        expect(isConflict(error)).toBeTruthy();
    });

    describe('method `formatError`', () => {
        test('error is not `OperationOutcome`', () => {
            const error = 'Error';
            const result = `Something went wrong.\n${JSON.stringify(error)}`;

            expect(formatError(error)).toEqual(result);
        });

        test('error is conflict', () => {
            const error = {
                resourceType: 'OperationOutcome',
                issue: [{ code: 'conflict' }],
            };

            const result = 'You have outdated data on the page. Please refresh the page and try again';

            expect(formatError(error)).toEqual(result);
        });

        test('process `OperationOutcome` error', () => {
            const error = {
                resourceType: 'OperationOutcome',
                issue: [{ code: 'specified code' }, { code: 'unknown code' }],
            };

            const result = `Something went wrong.\nError codes: specified code, unknown code`;

            expect(formatError(error)).toEqual(result);
        });
    });
});
