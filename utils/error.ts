import uniq from 'lodash.uniq';
import isPlainObject from 'lodash.isplainobject';

import { OperationOutcome } from "src/contrib/aidbox";

export function isOperationOutcome(error: any): error is OperationOutcome {
    return isPlainObject(error) && error.resourceType === 'OperationOutcome';
}

export function isConflict(error: OperationOutcome) {
    return error.issue.some((issue) => issue.code === 'conflict');
}

export function formatError(error: any) {
    if (!isOperationOutcome(error)) {
        return `Something went wrong.\n${JSON.stringify(error)}`;
    }

    if (isConflict(error)) {
        return 'You have outdated data on the page. Please refresh the page and try again';
    }

    const errorCodes = uniq(error.issue.map(issue => issue.code));

    return `Something went wrong.\nError codes: ${errorCodes.join(', ')}`;
}
