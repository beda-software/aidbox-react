import { act, renderHook } from '@testing-library/react-hooks';
import { Patient } from 'src/contrib/aidbox';
import { useCRUD } from '../../hooks/crud';
import { success, failure } from '../../libs/remoteData';
import {
    getFHIRResource,
    saveFHIRResource,
    saveFHIRResources,
    deleteFHIRResource,
    extractBundleResources,
} from '../../services/fhir';

jest.mock('../../services/fhir', () => ({
    getFHIRResource: jest.fn(),
    getReference: jest.fn(),
    saveFHIRResource: jest.fn(),
    saveFHIRResources: jest.fn(),
    makeReference: jest.fn(),
    extractBundleResources: jest.fn(),
    deleteFHIRResource: jest.fn(),
}));

describe('Hook `usePager`', () => {
    const resourceType = 'Patient';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('instance', () => {
        test('has correct default behavior', () => {
            const {
                result: {
                    current: [remoteData],
                },
            } = renderHook(() => useCRUD<Patient>(resourceType));

            expect(remoteData).toEqual({
                status: 'Success',
                data: { resourceType },
            });
        });

        test('has correct behavior with parameter `id`', async () => {
            (<jest.Mock>getFHIRResource).mockImplementation(() => success('data'));

            const id = 'toggle';
            const { result, waitForNextUpdate } = renderHook(() => useCRUD<Patient>(resourceType, id));

            expect(result.current[0]).toEqual({
                status: 'Loading',
            });

            await waitForNextUpdate();

            expect(result.current[0]).toEqual({
                status: 'Success',
                data: 'data',
            });
        });

        describe('has correct behavior with parameter `getOrCreate`', () => {
            const id = 'toggle';
            const getOrCreate = true;
            const defaultData = {
                id: 'toggle',
                resourceType,
            };

            test('when FHIR response success', async () => {
                (<jest.Mock>getFHIRResource).mockImplementation(() => success('data'));

                const { result, waitForNextUpdate } = renderHook(() => useCRUD<Patient>(resourceType, id, getOrCreate));

                expect(result.current[0]).toEqual({
                    status: 'Loading',
                });

                await waitForNextUpdate();

                expect(result.current[0]).toEqual({
                    status: 'Success',
                    data: 'data',
                });
            });

            test('when FHIR response has error', async () => {
                (<jest.Mock>getFHIRResource).mockImplementation(() => failure('error'));

                const { result, waitForNextUpdate } = renderHook(() => useCRUD<Patient>(resourceType, id, getOrCreate));

                expect(result.current[0]).toEqual({
                    status: 'Loading',
                });

                await waitForNextUpdate();

                expect(result.current[0]).toEqual({
                    status: 'Success',
                    data: defaultData,
                });
            });
        });

        describe('has correct behavior with parameter `defaultResource`', () => {
            const id = 'toggle';
            const getOrCreate = true;
            const defaultResource = {
                resourceType,
                active: false,
            } as Patient;

            test('when FHIR response success', async () => {
                (<jest.Mock>getFHIRResource).mockImplementation(() => success('data'));

                const { result } = renderHook(() =>
                    useCRUD<Patient>(resourceType, undefined, getOrCreate, defaultResource)
                );

                expect(result.current[0]).toEqual({
                    status: 'Success',
                    data: defaultResource,
                });
            });

            test('when FHIR response has error', async () => {
                (<jest.Mock>getFHIRResource).mockImplementation(() => failure('error'));

                const { result, waitForNextUpdate } = renderHook(() =>
                    useCRUD<Patient>(resourceType, id, getOrCreate, defaultResource)
                );

                expect(result.current[0]).toEqual({
                    status: 'Loading',
                });

                await waitForNextUpdate();

                expect(result.current[0]).toEqual({
                    status: 'Success',
                    data: { ...defaultResource, id },
                });
            });
        });
    });

    describe('method `handleSave`', () => {
        const resource = {
            resourceType,
        } as Patient;

        const relatedResources = [
            { id: 'fakeID-1', resourceType },
            { id: 'fakeID-2', resourceType },
        ];

        test('has correct behavior with `updatedResource` parameter', async () => {
            (<jest.Mock>getFHIRResource).mockImplementation(() => success('data'));
            (<jest.Mock>saveFHIRResource).mockImplementation(() => success('data'));

            const { result, waitForNextUpdate } = renderHook(() => useCRUD<Patient>(resourceType));
            const {
                current: [, { handleSave }],
            } = result;

            act(() => {
                handleSave(resource);
            });

            await waitForNextUpdate();

            expect(result.current[0]).toEqual({
                status: 'Success',
                data: 'data',
            });
        });

        describe('has correct behavior with additional `relatedResources` parameter', () => {
            describe('when `saveFHIRResources` returns `success` response', () => {
                test('when `extractBundleResources` returns `success` response', async () => {
                    (<jest.Mock>getFHIRResource).mockImplementation(() => success('data'));
                    (<jest.Mock>saveFHIRResources).mockImplementation(() => success('data'));
                    (<jest.Mock>extractBundleResources).mockImplementation(() => ({
                        [resourceType]: relatedResources,
                    }));

                    const { result, waitForNextUpdate } = renderHook(() => useCRUD<Patient>(resourceType));
                    const { handleSave } = result.current[1];

                    expect(result.current[0]).toEqual({
                        status: 'Success',
                        data: resource,
                    });

                    act(() => {
                        handleSave(resource, relatedResources);
                    });

                    expect(result.current[0]).toEqual({
                        status: 'Loading',
                    });

                    await waitForNextUpdate();

                    expect(result.current[0]).toEqual(
                        success({
                            id: 'fakeID-1',
                            resourceType,
                        })
                    );
                });

                test('when `extractBundleResources` returns `empty` response', async () => {
                    (<jest.Mock>getFHIRResource).mockImplementation(() => success('data'));
                    (<jest.Mock>saveFHIRResources).mockImplementation(() => success('data'));
                    (<jest.Mock>extractBundleResources).mockImplementation(() => null);

                    const { result } = renderHook(() => useCRUD<Patient>(resourceType));
                    const { handleSave } = result.current[1];

                    expect(result.current[0]).toEqual({
                        status: 'Success',
                        data: resource,
                    });

                    let response;

                    await act(async () => {
                        response = await handleSave(resource, relatedResources);
                    });

                    expect(response).toEqual(
                        failure({
                            message: 'empty response from server',
                        })
                    );
                });
            });

            test('when `saveFHIRResources` returns `error` response', async () => {
                (<jest.Mock>getFHIRResource).mockImplementation(() => success('data'));
                (<jest.Mock>saveFHIRResources).mockImplementation(() => failure('error'));

                const { result, waitForNextUpdate } = renderHook(() => useCRUD<Patient>(resourceType));
                const { handleSave } = result.current[1];

                expect(result.current[0]).toEqual({
                    status: 'Success',
                    data: resource,
                });

                act(() => {
                    handleSave(resource, relatedResources);
                });

                expect(result.current[0]).toEqual({
                    status: 'Loading',
                });

                await waitForNextUpdate();

                expect(result.current[0]).toEqual(failure('error'));
            });
        });
    });

    test('method `handleDelete`', async () => {
        (<jest.Mock>deleteFHIRResource).mockImplementation(() => success('data'));

        const resource = { resourceType } as Patient;

        const { result, waitForNextUpdate } = renderHook(() => useCRUD<Patient>(resourceType));
        const {
            current: [, { handleDelete }],
        } = result;

        act(() => {
            handleDelete(resource);
        });

        expect(result.current[0]).toEqual({
            status: 'Loading',
        });

        await waitForNextUpdate();

        expect(result.current[0]).toEqual({
            status: 'Success',
            data: 'data',
        });
    });
});
