import { useEffect } from 'react';

interface EventAction {
    type: string;
    [key: string]: any;
}

type Callback = (e: EventAction) => void;

const subscribers = new Map();

const subscribe = (type: string, callback: Callback) => {
    if (type === undefined || type === null) return;
    if (callback === undefined || callback === null) return;

    if (!subscribers.has(type)) subscribers.set(type, new Set());
    subscribers.get(type).add(callback);
};

const unsubscribe = (type: string, callback: Callback) => {
    if (!subscribers.has(type)) return;
    if (callback === undefined || callback === null) return;

    subscribers.get(type).delete(callback);

    if (subscribers.get(type).size === 0) subscribers.delete(type);
};

export const dispatch = (action: EventAction) => {
    let { type } = action;
    if (typeof action === 'string') type = action;

    if (!subscribers.has(type)) return;

    // if we use set without conversion to array
    // subscribers.get(type).forEach
    // it stucks if it has two same functions
    // tested on notification counter at home screen
    // It is not clear why it happens,
    // conversion to array did a trick
    // however it may only hide a real problem.
    const data = Array.from<Callback>(subscribers.get(type));
    data.forEach((callback: Callback) => {
        if (typeof action === 'string') {
            callback({ type });
        } else {
            callback(action);
        }
    });
};

export const bus = (type: string, callback: Callback, deps: Array<any> = []) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        subscribe(type, callback);

        return () => {
            unsubscribe(type, callback);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return dispatch;
};
