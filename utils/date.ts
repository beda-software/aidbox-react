import moment from 'moment';

export const FHIRDateFormat = 'YYYY-MM-DD';
export const FHIRTimeFormat = 'HH:mm:ss';
export const FHIRDateTimeFormat = 'YYYY-MM-DDTHH:mm:ss[Z]';

export const formatFHIRTime = (date: Date | moment.Moment) => moment(date).format(FHIRTimeFormat);
export const formatFHIRDate = (date: Date | moment.Moment) => moment(date).format(FHIRDateFormat);
export const formatFHIRDateTime = (date: Date | moment.Moment) => moment(date).utc().format(FHIRDateTimeFormat);

export const parseFHIRTime = (date: string) => moment(date, FHIRTimeFormat);
export const parseFHIRDate = (date: string) => moment(date, FHIRDateFormat);
export const parseFHIRDateTime = (date: string) => moment.utc(date, FHIRDateTimeFormat).local();

export const makeFHIRDateTime = (date: string, time = '00:00:00') =>
    formatFHIRDateTime(moment(`${date}T${time}`, `${FHIRDateFormat}T${FHIRTimeFormat}`));

export const extractFHIRDate = (date: string) => {
    if (date.length === FHIRDateFormat.length) {
        return date;
    }

    return formatFHIRDate(parseFHIRDateTime(date));
};

export const extractFHIRTime = (date: string) => {
    if (date.length === FHIRTimeFormat.length) {
        return date;
    }

    return formatFHIRTime(parseFHIRDateTime(date));
};

export const isFHIRDateEqual = (date1: string, date2: string) => extractFHIRDate(date1) === extractFHIRDate(date2);
