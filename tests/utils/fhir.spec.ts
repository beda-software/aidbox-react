import { cleanEmptyValues, removeNullsFromDicts } from '../../src/utils/fhir';

describe('cleanEmptyValues', () => {
    it('cleans empty values from dictionaries and arrays recursively', () => {
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
});
