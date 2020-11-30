import { isSuccess, RemoteData, RemoteDataResult } from '../libs/remoteData'
import { axiosInstance, resetInstanceToken, setInstanceToken } from '../services/instance'
import { service } from '../services/service'
import { Token } from '../services/token'
import { User } from 'shared/lib/contrib/aidbox'

export type LoginService = (user: User) => Promise<RemoteData<Token>>

export async function withRootAccess<R>(fn: () => Promise<R>) {
    axiosInstance.defaults.auth = {
        username: 'root',
        password: 'secret',
    }
    try {
        return await fn()
    } finally {
        delete axiosInstance.defaults.auth
    }
}

export function ensure<R>(result: RemoteData<R>): R {
    if (isSuccess(result)) {
        return result.data
    }
    throw new Error(`Network error ${JSON.stringify(result)}`)
}

export async function getToken(user: User, loginService: LoginService): Promise<Token> {
    if (!user.email) {
        throw new Error('Can not login for user without an email')
    }

    const result = await loginService(user)

    return ensure(result)
}

export async function login(user: User, loginService: LoginService): Promise<Token> {
    resetInstanceToken()
    const token = await getToken(user, loginService)
    setInstanceToken(token)

    return token
}

export async function getUserInfo(): Promise<User> {
    const result: RemoteDataResult<User> = await service({
        method: 'GET',
        url: '/auth/userinfo',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    })

    return ensure(result)
}
