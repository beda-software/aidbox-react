import { 
    axiosInstance,
    buildQueryParams,
    setInstanceBaseURL,
    setInstanceToken,
    resetInstanceToken
} from '../../services/instance'

describe('Service `instance`', () => {
    describe('method `buildQueryParams`', () => {
        [
            [{a: 1}, 'a=1'],
            [{a: true}, 'a=true'],
            [{a: "42"}, 'a=42'],
            [{a: [1, 2, 3]}, 'a=1&a=2&a=3'],
            [{a: 1, b: 2}, 'a=1&b=2'],
            [{a: 1, b: undefined}, 'a=1'],
        ].forEach(([params, query]) => {
            test(`use for ${JSON.stringify(params)} 'returns ${query}`, () => {
                expect(buildQueryParams(<object>params)).toEqual(query)
            })
        })
    })
})
