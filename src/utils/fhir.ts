function isEmptyObject(data: any) {
    return typeof data === 'object' && !Array.isArray(data) && data !== null && Object.keys(data).length === 0;
}

export function cleanObject(data: any, topLevel = true): any {
    if (Array.isArray(data)) {
        const cleanedArray = data.map((item) => {
            const cleaned = cleanObject(item, false);
            //NOTE: convert undefined → null
            return cleaned === undefined ? null : cleaned;
        });

        //NOTE: Trim trailing nulls
        while (cleanedArray.length > 0 && cleanedArray[cleanedArray.length - 1] === null) {
            cleanedArray.pop();
        }

        return cleanedArray.length > 0 ? cleanedArray : undefined;
    }

    if (typeof data === 'object' && data !== null) {
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            const cleanedValue = cleanObject(value, false);

            if (cleanedValue !== undefined && cleanedValue !== null && !isEmptyObject(cleanedValue)) {
                result[key] = cleanedValue;
            }
        }

        const isEmptyResult = Object.keys(result).length === 0;

        if (topLevel && isEmptyResult) {
            return {};
        }

        return isEmptyResult ? undefined : result;
    }

    return data;
}
