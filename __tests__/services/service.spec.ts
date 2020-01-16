import {
    Status,
    RemoteDataSuccess,
    RemoteDataFailure
} from '../../libs/remoteData';

import { 
    service,
    applyDataTransformer,
    applyErrorTransformer,
    resolveServiceMap,
    PromiseRemoteDataResultMap
} from '../../services/service';


describe('Service `service`', () => {

    interface TransformedData<T> {
        transformed: T;
        isTransformed: true;
    }

    const responseDataFailed = <RemoteDataFailure<string>> {
        error: 'error',
        status: Status.Failure
    }

    const responseDataSuccess = <RemoteDataSuccess<string>> {
        data: 'data',
        status: Status.Success
    }

    const transformer = <T = any>(response: T): TransformedData<T> => {
        return {
            transformed: response,
            isTransformed: true
        }
    }

    describe('Method `applyErrorTransformer`', () => {
        test('process failed response', async () => {
            const response = Promise.resolve(responseDataFailed)
            const transformed = <RemoteDataFailure<TransformedData<string>>> await applyErrorTransformer(
                <Promise<RemoteDataFailure<string>>>response, transformer
            )

            await expect(transformed.error.isTransformed).toBeTruthy()
        })

        test('process success response', async () => {
            const response = Promise.resolve(responseDataSuccess)
            const transformed = <RemoteDataSuccess<string>> await applyErrorTransformer(
                <Promise<RemoteDataSuccess<string>>>response, transformer
            )

            await expect(transformed).toEqual(responseDataSuccess)
        })
    })

    describe('Method `applyDataTransformer`', () => {
        test('process failed response', async () => {
            const response = Promise.resolve(responseDataFailed)
            const transformed = <RemoteDataFailure<string>> await applyDataTransformer(
                <Promise<RemoteDataFailure<string>>>response, transformer
            )

            await expect(transformed).toEqual(responseDataFailed)
        })

        test('process success response', async () => {
            const response = Promise.resolve(responseDataSuccess)
            const transformed = <RemoteDataSuccess<any>> await applyDataTransformer(
                <Promise<RemoteDataSuccess<string>>>response, transformer
            )
            
            await expect(transformed.data.isTransformed).toBeTruthy()
        })
    })

    describe('Method `resolveServiceMap`', () => {
        test('process when all responses are failed', async () => {
            const responses = <PromiseRemoteDataResultMap<any, string>> {
                a: Promise.resolve(responseDataFailed),
                b: Promise.resolve(responseDataFailed)
            }

            const result = await resolveServiceMap(responses)

            await expect(result).toEqual({
                "error": ["error", "error"], 
                "status": "Failure"
            })
        })

        test('process when all responses are mixed', async () => {
            const responses = <PromiseRemoteDataResultMap<any, string>> {
                a: Promise.resolve(responseDataSuccess),
                b: Promise.resolve(responseDataFailed)
            }

            const result = await resolveServiceMap(responses)

            await expect(result).toEqual({
                "error": ["error"], 
                "status": "Failure"
            })
        })

        test('process when all responses are success', async () => {
            const responses = <PromiseRemoteDataResultMap<any, string>> {
                a: Promise.resolve(responseDataSuccess),
                b: Promise.resolve(responseDataSuccess)
            }

            const result = await resolveServiceMap(responses)

            await expect(result).toEqual({
                data: {
                    a: "data", 
                    b: "data"
                }, 
                status: "Success"
            })
        })
    })

})
