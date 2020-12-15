import { useEffect } from 'react';

export interface EventAction {
    type: string;
}

type Callback<T extends EventAction> = (e: T) => void;

const subscribers = new Map();

function subscribe<T extends EventAction>(type: T['type'], callback: Callback<T>) {
    if (type === undefined || type === null) return;
    if (callback === undefined || callback === null) return;

    if (!subscribers.has(type)) subscribers.set(type, new Set());
    subscribers.get(type).add(callback);
}

function unsubscribe<T extends EventAction>(type: T['type'], callback: Callback<T>) {
    if (!subscribers.has(type)) return;
    if (callback === undefined || callback === null) return;

    subscribers.get(type).delete(callback);

    if (subscribers.get(type).size === 0) subscribers.delete(type);
}

type Dispatch<T extends EventAction> = (action: T) => void;

function dispatch<T extends EventAction>(action: T) {
    const type: T['type'] = action.type;

    if (!subscribers.has(type)) return;

    // if we use set without conversion to array
    // subscribers.get(type).forEach
    // it stucks if it has two same functions
    // tested on notification counter at home screen
    // It is not clear why it happens,
    // conversion to array did a trick
    // however it may only hide a real problem.
    const data = Array.from<Callback<T>>(subscribers.get(type));
    data.forEach((callback: Callback<T>) => {
        callback(action);
    });
}

type UseBus<T extends EventAction> = (type: T['type'], callback: Callback<T>, deps: Array<any>) => Dispatch<T>;

function useBus<T extends EventAction>(type: T['type'], callback: Callback<T>, deps: Array<any> = []) {
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

export function createBus<T extends EventAction>() {
    const useBusTyped: UseBus<T> = useBus;
    const dispatchTyped: Dispatch<T> = dispatch;
    return {
        useBus: useBusTyped,
        dispatch: dispatchTyped,
    };
}

// Example of usage
// interface Inc extends EventAction{
//     type: 'inc',
// }

// interface Dec extends EventAction{
//     type: 'dec',
// }

// type Event = Inc|Dec

// const b = createBus<Event>()

// //ok
// b.dispatch({type: 'inc'})

// //ok
// b.dispatch({type: 'dec'})

// //type error
// b.dispatch({type: 'foo'})
