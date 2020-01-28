export type id = string;
export type uri = string;
export type instant = string;

export interface AidboxResource {
    resourceType: string;
    id?: string;
    meta?: Meta;
}

export interface AidboxReference<R extends AidboxResource> {
    resourceType: R['resourceType'];
    id: string;
    display?: string;
    resource?: any;
}

export interface BundleEntry<R extends AidboxResource> {
    id?: string;
    resource?: R;
}

export interface Bundle<R extends AidboxResource> {
    readonly resourceType: 'Bundle';
    id?: string;
    entry?: Array<BundleEntry<R>>;
    link?: BundleLink[];
}

export interface BundleParam {
    type: string;
    value: string | number;
}

export interface BundleLink {
    id?: string;
    relation: string;
    url: uri;
}

export interface Patient {
    readonly resourceType: 'Patient';
    id?: id;
    meta?: Meta;
    implicitRules?: uri;
    contained?: AidboxResource[];
    active?: boolean;
}

export interface ValueSet {
    readonly resourceType: 'ValueSet';
}

export interface Meta {
    id?: string;
    versionId?: id;
    lastUpdated?: instant;
}

export interface User {
    readonly resourceType: 'User';
    id: string;
    email: string;
    password: string;
    data: any;
    emailConfirmed?: boolean;
    meta: Meta;
}
