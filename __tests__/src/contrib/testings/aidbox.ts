export interface AidboxResource {
    resourceType: string;
    id?: string;
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
    readonly resourceType: "Bundle";
    id?: id;
    entry?: Array<BundleEntry<R>>;
}

export interface BundleParam {
    type: string;
    value: string | number;
}

export interface ValueSet {
    readonly resourceType: "ValueSet";
}

export interface User {
    readonly resourceType: "User";
    id: string;
    email: string;
    password: string;
    data: any;
    emailConfirmed?: boolean;
    meta: Meta;
}