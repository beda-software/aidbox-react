import { cleanObject } from '../../src/utils/fhir';

test.each([
    { data: {}, expected: {} },
    { data: { str: '' }, expected: { str: '' } },
    { data: { item: null }, expected: {} },
    { data: { item: undefined }, expected: {} },
    { data: { nested: { nested2: [null, {}] } }, expected: {} },
    { data: { nested: { nested2: [undefined, {}] } }, expected: {} },
    { data: { item: [null, { item: null }, {}] }, expected: {} },
    { data: { item: [undefined, { item: undefined }, {}] }, expected: {} },
    { data: { item: [null, { item: null }] }, expected: {} },
    { data: { item: [undefined, { item: undefined }] }, expected: {} },
    { data: { item: [] }, expected: {} },
    {
        data: { nested: { nested2: [null, { nested3: 'some value' }, null] } },
        expected: { nested: { nested2: [null, { nested3: 'some value' }] } },
    },
    {
        data: { nested: { nested2: [undefined, { nested3: 'some value' }, undefined] } },
        expected: { nested: { nested2: [null, { nested3: 'some value' }] } },
    },
])('cleanObnject(). Test case: %o', ({ data, expected }) => {
    expect(cleanObject(data)).toEqual(expected);
});
