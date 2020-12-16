import { useEffect } from 'react';

export interface BaseAction {
    type: unknown;
}

type ExactlyOne<T, TKey = keyof T> = TKey extends keyof T
    ? { [key in Exclude<keyof T, TKey>]?: never } & { [key in TKey]: T[key] }
    : never;
type GetOnlyBaseActions<T> = T extends ExactlyOne<T, 'type'> ? T : never;

// Alternative implementation
// type GetOnlyBaseActions<T extends BaseAction> = T extends unknown
//     ? keyof T extends keyof BaseAction
//     ? T
//     : never
// : never;

type Callback<T extends BaseAction> = (e: T) => void;

const subscribers = new Map();

function subscribe<T extends BaseAction>(type: T['type'], callback: Callback<T>) {
    if (type === undefined || type === null) return;
    if (callback === undefined || callback === null) return;

    if (!subscribers.has(type)) subscribers.set(type, new Set());
    subscribers.get(type).add(callback);
}

function unsubscribe<T extends BaseAction>(type: T['type'], callback: Callback<T>) {
    if (!subscribers.has(type)) return;
    if (callback === undefined || callback === null) return;

    subscribers.get(type).delete(callback);

    if (subscribers.get(type).size === 0) subscribers.delete(type);
}

type Dispatch<T extends BaseAction> = (action: T | GetOnlyBaseActions<T>['type']) => void;

function isAction<T extends BaseAction>(actionOrType: T | GetOnlyBaseActions<T>['type']): actionOrType is T {
    return typeof actionOrType !== 'string';
}

function dispatch<T extends BaseAction>(actionOrType: T | GetOnlyBaseActions<T>['type']) {
    const action: T = isAction(actionOrType) ? actionOrType : ({ type: actionOrType } as T);

    if (!subscribers.has(action.type)) return;

    // if we use set without conversion to array
    // subscribers.get(type).forEach
    // it stucks if it has two same functions
    // tested on notification counter at home screen
    // It is not clear why it happens,
    // conversion to array did a trick
    // however it may only hide a real problem.
    const data = Array.from<Callback<T>>(subscribers.get(action.type));
    data.forEach((callback: Callback<T>) => {
        callback(action);
    });
}

type UseBus<T extends BaseAction> = (type: T['type'], callback: Callback<T>, deps: Array<any>) => Dispatch<T>;

function useBus<T extends BaseAction>(type: T['type'], callback: Callback<T>, deps: Array<any>) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        subscribe(type, callback);

        return () => {
            unsubscribe(type, callback);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return dispatch;
}

export function createBus<T extends BaseAction = never>() {
    const useBusTyped: UseBus<T> = useBus;
    const dispatchTyped: Dispatch<T> = dispatch;
    return {
        useBus: useBusTyped,
        dispatch: dispatchTyped,
    };
}

// Example of usage

// interface Inc {
//     type: 'inc';
// }

// interface Dec {
//     type: 'dec';
//     value: number;
// }

// type Event = Inc | Dec;

// const b = createBus<Event>();

// // ok
// b.dispatch({ type: 'inc' });
// b.dispatch('inc');
// b.dispatch({ type: 'dec', value: 1 });
// b.useBus('inc', () => {}, []);
// b.useBus('dec', () => {}, []);

// // error
// b.dispatch({ type: 'dec' });
// b.dispatch('dec');
// b.dispatch({ type: 'foo' });
// b.useBus('__super_error__', () => {}, []);
