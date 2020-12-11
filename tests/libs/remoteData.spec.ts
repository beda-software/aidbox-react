import {
    success,
    failure,
    notAsked,
    loading,
    isNotAsked,
    isLoading,
    isSuccess,
    isSuccessAll,
    isFailure,
    isFailureAny,
    isLoadingAny,
    isNotAskedAny,
} from '../../src/libs/remoteData';

describe('Lib `remoteData`', () => {
    test('method `success`', () => {
        expect(success('value')).toEqual({
            status: 'Success',
            data: 'value',
        });
    });

    test('method `failure`', () => {
        expect(failure('error')).toEqual({
            status: 'Failure',
            error: 'error',
        });
    });

    test('method `isNotAsked`', () => {
        expect(isNotAsked(notAsked)).toBeTruthy();
        expect(isNotAsked(loading)).toBeFalsy();
        expect(isNotAsked(failure('error'))).toBeFalsy();
        expect(isNotAsked(success('value'))).toBeFalsy();
    });

    test('method `isLoading`', () => {
        expect(isLoading(loading)).toBeTruthy();
        expect(isLoading(notAsked)).toBeFalsy();
        expect(isLoading(failure('error'))).toBeFalsy();
        expect(isLoading(success('value'))).toBeFalsy();
    });

    test('method `isFailure`', () => {
        expect(isFailure(loading)).toBeFalsy();
        expect(isFailure(notAsked)).toBeFalsy();
        expect(isFailure(failure('error'))).toBeTruthy();
        expect(isFailure(success('value'))).toBeFalsy();
    });

    test('method `isSuccess`', () => {
        expect(isSuccess(notAsked)).toBeFalsy();
        expect(isSuccess(loading)).toBeFalsy();
        expect(isSuccess(failure('error'))).toBeFalsy();
        expect(isSuccess(success('value'))).toBeTruthy();
    });

    test('method `isSuccessAll`', () => {
        expect(isSuccessAll([success('a'), success('b')])).toBeTruthy();
        expect(isSuccessAll([success('a'), failure('b')])).toBeFalsy();
    });

    test('method `isFailureAny`', () => {
        expect(isFailureAny([success('a'), failure('b')])).toBeTruthy();
        expect(isFailureAny([success('a'), success('b')])).toBeFalsy();
    });

    test('method `isLoadingAny`', () => {
        expect(isLoadingAny([success('a'), loading])).toBeTruthy();
        expect(isLoadingAny([success('a'), success('b')])).toBeFalsy();
    });

    test('method `isNotAskedAny`', () => {
        expect(isNotAskedAny([success('a'), notAsked])).toBeTruthy();
        expect(isNotAskedAny([success('a'), success('b')])).toBeFalsy();
    });
});
