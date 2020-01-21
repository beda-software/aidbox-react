import { success, failure } from '../../libs/remoteData';

import {
    service,
    mapFailure,
    mapSuccess,
    applyDataTransformer,
    applyErrorTransformer,
    resolveServiceMap,
    PromiseRemoteDataResultMap,
} from '../../services/service';

describe('Service `service`', () => {
    interface TransformedData<T> {
        transformed: T;
        isTransformed: true;
    }

    const transformer = <T = any>(response: T): TransformedData<T> => {
        return {
            transformed: response,
            isTransformed: true,
        };
    };

    describe('Method `service`', () => {
        test('returns success response', async () => {
            const result = await service({ url: 'success' });

            expect(result).toEqual(success('data-success'));
        });

        test('returns failed response', async () => {
            const result = await service({ url: 'error-data' });

            expect(result).toEqual(failure('error-data'));
        });

        test('returns failed response', async () => {
            const result = await service({ url: 'error-message' });

            expect(result).toEqual(failure('error-message'));
        });
    });

    describe('Method `applyErrorTransformer`', () => {
        test('process failed response', async () => {
            const data = failure('error');
            const response = Promise.resolve(data);
            const transformed = await applyErrorTransformer(response, transformer);

            await expect(transformed).toEqual(
                failure({
                    isTransformed: true,
                    transformed: 'error',
                })
            );
        });

        test('process success response', async () => {
            const data = success('data');
            const response = Promise.resolve(data);
            const transformed = await applyErrorTransformer(response, transformer);

            await expect(transformed).toEqual(data);
        });
    });

    describe('Method `applyDataTransformer`', () => {
        test('process failed response', async () => {
            const data = failure('error');
            const response = Promise.resolve(data);
            const transformed = await applyDataTransformer(response, transformer);

            await expect(transformed).toEqual(data);
        });

        test('process success response', async () => {
            const data = success('data');
            const response = Promise.resolve(data);
            const transformed = await applyDataTransformer(response, transformer);

            await expect(transformed).toEqual(
                success({
                    isTransformed: true,
                    transformed: 'data',
                })
            );
        });
    });

    describe('Method `mapSuccess`', () => {
        test('process failed data response', () => {
            const data = failure('error');
            const transformed = mapSuccess(data, transformer);

            expect(transformed).toEqual(data);
        });

        test('process success data response', () => {
            const data = success('data');
            const transformed = mapSuccess(data, transformer);

            expect(transformed).toEqual(
                success({
                    isTransformed: true,
                    transformed: 'data',
                })
            );
        });
    });

    describe('Method `mapFailure`', () => {
        test('process failed data response', () => {
            const data = failure('error');
            const transformed = mapFailure(data, transformer);

            expect(transformed).toEqual(
                failure({
                    isTransformed: true,
                    transformed: 'error',
                })
            );
        });

        test('process success data response', () => {
            const data = success('data');
            const transformed = mapFailure(data, transformer);

            expect(transformed).toEqual(data);
        });
    });

    describe('Method `resolveServiceMap`', () => {
        test('process when all responses are failed', async () => {
            const responses = <PromiseRemoteDataResultMap<any, string>>{
                a: Promise.resolve(failure('error')),
                b: Promise.resolve(failure('error')),
            };

            const result = await resolveServiceMap(responses);

            await expect(result).toEqual(failure(['error', 'error']));
        });

        test('process when all responses are mixed', async () => {
            const responses = <PromiseRemoteDataResultMap<any, string>>{
                a: Promise.resolve(success('data')),
                b: Promise.resolve(failure('error')),
            };

            const result = await resolveServiceMap(responses);

            await expect(result).toEqual(failure(['error']));
        });

        test('process when all responses are success', async () => {
            const responses = <PromiseRemoteDataResultMap<any, string>>{
                foo: Promise.resolve(success('data-foo')),
                bar: Promise.resolve(success('data-bar')),
            };

            const result = await resolveServiceMap(responses);

            await expect(result).toEqual(
                success({
                    foo: 'data-foo',
                    bar: 'data-bar',
                })
            );
        });
    });
});
