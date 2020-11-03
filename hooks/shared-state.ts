import { useState } from 'react';
import { uuid4 } from '../utils/uuid';
import { bus, dispatch } from './bus';

interface StateManager<S> {
    getSharedState: () => S;
    setSharedState: (s: S) => void;
    useSharedState: () => [S, (s: S) => void];
}

export function createSharedState<S>(initial: S): StateManager<S> {
    const uniqBus = uuid4();
    let mutableState: S = initial;
    const setter = (s: S) => {
        mutableState = s;
        dispatch({ type: uniqBus, s });
    };

    return {
        setSharedState: setter,
        getSharedState: () => mutableState,
        useSharedState: () => {
            const [state, setState] = useState<S>(mutableState);
            bus(
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
