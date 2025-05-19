import { cleanEmptyValues, removeNullsFromDicts } from '../../src/utils/fhir';

describe('cleanEmptyValues', () => {
    it('cleans null values from dictionaries and arrays recursively', () => {
        expect(cleanEmptyValues({})).toEqual({});
        expect(cleanEmptyValues({ str: '' })).toEqual({ str: '' });

        expect(cleanEmptyValues({ nested: { nested2: [{}] } })).toEqual({
            nested: { nested2: [null] },
        });

        expect(cleanEmptyValues({ nested: { nested2: {} } })).toEqual({});

        expect(cleanEmptyValues({ item: [] })).toEqual({});
        expect(cleanEmptyValues({ item: [null] })).toEqual({ item: [null] });

        expect(cleanEmptyValues({ item: [null, { item: null }] })).toEqual({
            item: [null, { item: null }],
        });

        expect(cleanEmptyValues({ item: [null, { item: null }, {}] })).toEqual({
            item: [null, { item: null }, null],
        });
    });

    it('cleans undefined values from dictionaries and arrays recursively', () => {
        expect(cleanEmptyValues({})).toEqual({});
        expect(cleanEmptyValues({ str: '' })).toEqual({ str: '' });

        expect(cleanEmptyValues({ nested: { nested2: [{}] } })).toEqual({
            nested: { nested2: [null] },
        });

        expect(cleanEmptyValues({ nested: { nested2: {} } })).toEqual({});

        expect(cleanEmptyValues({ item: [] })).toEqual({});
        expect(cleanEmptyValues({ item: [undefined] })).toEqual({ item: [null] });

        expect(cleanEmptyValues({ item: [undefined, { item: undefined }] })).toEqual({
            item: [null, { item: null }],
        });

        expect(cleanEmptyValues({ item: [undefined, { item: undefined }, {}] })).toEqual({
            item: [null, { item: null }, null],
        });
    });
});

describe('removeNullsFromDicts', () => {
    it('removes nulls from nested dictionaries but not from arrays', () => {
        expect(removeNullsFromDicts({})).toEqual({});
        expect(removeNullsFromDicts({ item: [] })).toEqual({ item: [] });
        expect(removeNullsFromDicts({ item: [null] })).toEqual({ item: [null] });
        expect(removeNullsFromDicts({ item: [null, { item: null }] })).toEqual({
            item: [null, {}],
        });
        expect(removeNullsFromDicts({ item: [null, { item: null }, {}] })).toEqual({
            item: [null, {}, {}],
        });
    });

    it('removes undefined from nested dictionaries but not from arrays', () => {
        expect(removeNullsFromDicts({})).toEqual({});
        expect(removeNullsFromDicts({ item: [] })).toEqual({ item: [] });
        expect(removeNullsFromDicts({ item: [undefined] })).toEqual({ item: [null] });
        expect(removeNullsFromDicts({ item: [undefined, { item: undefined }] })).toEqual({
            item: [null, {}],
        });
        expect(removeNullsFromDicts({ item: [null, { item: null }, {}] })).toEqual({
            item: [null, {}, {}],
        });
    });
});

describe('combine two cleaning functions', () => {
    const data = { item: [undefined, { item: undefined }, {}] };
    expect(cleanEmptyValues(removeNullsFromDicts(data))).toEqual({ item: [null, null, null] });
});
