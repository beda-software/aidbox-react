import { useState } from 'react';
import { uuid4 } from '../utils/uuid';
import { createBus, EventAction } from './bus';

export interface StateManager<S> {
    getSharedState: () => S;
    setSharedState: (s: S) => void;
    useSharedState: () => [S, (s: S) => void];
}

interface SyncAction<S> extends EventAction {
    s: S;
}

export class SharedStateInitializationError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export function createSharedState<S>(initial?: S): StateManager<S> {
    const uniqBus = uuid4();
    const { useBus, dispatch } = createBus<SyncAction<S>>();
    let mutableState: S | undefined = initial;
    const setter = (s: S) => {
        mutableState = s;
        dispatch({ type: uniqBus, s });
    };

    return {
        setSharedState: setter,
        getSharedState: () => {
            if (typeof mutableState === 'undefined') {
                throw new SharedStateInitializationError();
            }
            return mutableState;
        },
        useSharedState: () => {
            const [state, setState] = useState<S | undefined>(mutableState);
            if (typeof state === 'undefined') {
                throw new SharedStateInitializationError();
            }
            useBus(
                uniqBus,
                ({ s }) => {
                    setState(s);
                },
                [setState]
            );

            return [state, setter];
        },
    };
}
