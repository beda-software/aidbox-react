import { User } from 'shared/src/contrib/aidbox';

import { success, failure } from '../../src/libs/remoteData';
import { axiosInstance } from '../../src/services/instance';
import { service } from '../../src/services/service';
import { ensure, login, getUserInfo, getToken, withRootAccess, LoginService } from '../../src/utils/tests';

jest.mock('../../src/services/service', () => ({ service: jest.fn() }));

describe('Util `tests`', () => {
    const user: User = {
        resourceType: 'User',
        id: 'id',
        password: 'password',
        email: 'user@company.com',
        data: null,
        meta: {},
    };

    const token = {
        access_token: 'token',
        token_type: 'token',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('method `withRootAccess`', () => {
        test('correct async function', async () => {
            const fn = jest.fn(async () => {});

            const beforeAuth = axiosInstance.defaults.auth;

            await withRootAccess(fn);

            expect(fn.mock.calls[0]).toEqual([]);
            expect(axiosInstance.defaults.auth).toEqual(beforeAuth);
        });

        test('async function with throw error', async () => {
            const fn = jest.fn(async () => {
                throw new Error('custom error');
            });

            await expect(withRootAccess(fn)).rejects.toThrow(Error);

            expect(axiosInstance.defaults.auth).toBeUndefined();
        });
    });

    describe('method `ensure`', () => {
        const data = 'lorem ipsum';

        test('process `success` result', () => {
            expect(ensure(success(data))).toBe(data);
        });

        test('process not `success` result', () => {
            const fn = () => ensure(failure(data));

            expect(fn).toThrowError(`Network error ${JSON.stringify(failure(data))}`);
        });
    });

    describe('method `getToken`', () => {
        test('has `email`', async () => {
            const loginService: LoginService = jest.fn(async () => await success(token));

            await getToken(user, loginService);

            expect((loginService as jest.Mock).mock.calls[0]).toEqual([user]);
        });

        test('has no `email`', async () => {
            const loginService: LoginService = jest.fn(async () => await success(token));

            await expect(getToken({ ...user, email: '' }, loginService)).rejects.toThrow(Error);

            expect(loginService).not.toBeCalled();
        });
    });

    test('method `login`', async () => {
        const loginService: LoginService = jest.fn(async () => await success(token));

        await login(user, loginService);

        expect((loginService as jest.Mock).mock.calls[0]).toEqual([user]);
    });

    test('method `getUserInfo`', async () => {
        (<jest.Mock>service).mockImplementation(() => success(user));

        const result = await getUserInfo();

        expect((service as jest.Mock).mock.calls[0][0]).toEqual({
            method: 'GET',
            url: '/auth/userinfo',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });

        expect(result).toEqual(user);
    });
});
