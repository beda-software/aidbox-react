import React from 'react';

import { isFailure, isLoading, isNotAsked, isSuccess, RemoteData } from '../../libs/remoteData';
import { formatError } from '../../utils/error';

interface RenderConfig<E = any> {
    renderFailure?: (error: E) => React.ReactElement;
    renderLoading?: () => React.ReactElement;
    renderNotAsked?: () => React.ReactElement;
}

interface RenderRemoteDataBasicProps<S, E = any> {
    remoteData: RemoteData<S, E>;
    children: (data: S) => React.ReactElement;
}

function renderFailureDefault<E>(error: E) {
    return <>{formatError(error)}</>;
}

function renderLoadingDefault() {
    return <>Loading...</>;
}

type RenderRemoteDataProps<S, E = any> = RenderRemoteDataBasicProps<S> & RenderConfig<E>;

export function RenderRemoteData<S, E = any>(props: RenderRemoteDataProps<S, E>) {
    const { remoteData, children, renderFailure, renderLoading, renderNotAsked } = props;
    if (isNotAsked(remoteData)) {
        return renderNotAsked ? renderNotAsked() : null;
    } else if (isLoading(remoteData)) {
        return (renderLoading ?? renderLoadingDefault)();
    } else if (isFailure(remoteData)) {
        return (renderFailure ?? renderFailureDefault)(remoteData.error);
    } else if (isSuccess(remoteData)) {
        return children(remoteData.data);
    } else {
        const n: never = remoteData;
        throw new Error(n);
    }
}

export function withRender<E = any>(config: RenderConfig<E>) {
    return function<S>(props: RenderRemoteDataProps<S, E>) {
        return <RenderRemoteData {...config} {...props} />;
    };
}
