import {
    FHIRDateFormat,
    FHIRTimeFormat,
    FHIRDateTimeFormat,
    parseFHIRTime,
    parseFHIRDate,
    parseFHIRDateTime,
    extractFHIRDate,
    extractFHIRTime,
} from '../../src/utils/date';

describe('Util `tests`', () => {
    describe(`parse and format`, () => {
        test('time', () => {
            expect(parseFHIRTime('12').format(FHIRTimeFormat)).toEqual('12:00:00');
            expect(parseFHIRTime('13:30').format(FHIRTimeFormat)).toEqual('13:30:00');
            expect(parseFHIRTime('21:30:15').format(FHIRTimeFormat)).toEqual('21:30:15');
        });

        test('date', () => {
            expect(parseFHIRDate('2020').format(FHIRDateFormat)).toEqual('2020-01-01');
            expect(parseFHIRDate('2020-10').format(FHIRDateFormat)).toEqual('2020-10-01');
            expect(parseFHIRDate('2020-10-05').format(FHIRDateFormat)).toEqual('2020-10-05');
        });

        test('datetime', () => {
            expect(parseFHIRDateTime('2020').format(FHIRDateTimeFormat)).toEqual('2020-01-01T00:00:00Z');
            expect(parseFHIRDateTime('2020-10').format(FHIRDateTimeFormat)).toEqual('2020-10-01T00:00:00Z');
            expect(parseFHIRDateTime('2020-10-05').format(FHIRDateTimeFormat)).toEqual('2020-10-05T00:00:00Z');
            expect(parseFHIRDateTime('2020-10-05 12').format(FHIRDateTimeFormat)).toEqual('2020-10-05T12:00:00Z');
            expect(parseFHIRDateTime('2020-10-05 13:30').format(FHIRDateTimeFormat)).toEqual('2020-10-05T13:30:00Z');
            expect(parseFHIRDateTime('2020-10-05 20:00:00').format(FHIRDateTimeFormat)).toEqual('2020-10-05T20:00:00Z');
            expect(parseFHIRDateTime('2020-10-05 20:00:00').format(FHIRDateTimeFormat)).toEqual('2020-10-05T20:00:00Z');
        });
    });

    describe(`extract`, () => {
        test('method `extractFHIRDate`', () => {
            expect(extractFHIRDate('2020')).toEqual('2020-01-01');
            expect(extractFHIRDate('2020-10')).toEqual('2020-10-01');
            expect(extractFHIRDate('2020-10-10')).toEqual('2020-10-10');
            expect(extractFHIRDate('9999-99-99')).toEqual('9999-99-99');
        });

        test('method `extractFHIRTime`', () => {
            expect(extractFHIRTime('15:10:10')).toEqual('15:10:10');
        });
    });
});
