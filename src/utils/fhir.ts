function isEmpty(data: any): boolean {
    if (Array.isArray(data)) {
        return data.length === 0;
    }

    if (typeof data === 'object' && data !== null) {
        return Object.keys(data).length === 0;
    }

    return false;
}

export function cleanEmptyValues(data: any): any {
    if (Array.isArray(data)) {
        return data.map((item) => {
            return isEmpty(item) ? null : cleanEmptyValues(item);
        });
    }

    if (typeof data === 'object' && data !== null) {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            const cleanedValue = cleanEmptyValues(value);
            if (!isEmpty(cleanedValue)) {
                cleaned[key] = cleanedValue;
            }
        }
        return cleaned;
    }

    if (typeof data === 'undefined') {
        return null;
    }

    return data;
}

function isNull(value: any): boolean {
    return value === null || value === undefined;
}

export function removeNullsFromDicts(data: any): any {
    if (Array.isArray(data)) {
        return data.map(removeNullsFromDicts);
    }

    if (typeof data === 'object' && data !== null) {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (!isNull(value)) {
                result[key] = removeNullsFromDicts(value);
            }
        }
        return result;
    }

    if (typeof data === 'undefined') {
        return null;
    }

    return data;
}
