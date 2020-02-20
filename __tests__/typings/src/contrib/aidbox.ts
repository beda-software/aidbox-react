export type id = string;
export type uri = string;
export type unsignedInt = number;
export type instant = string;
export type code = string;
export type decimal = number;

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

export interface Extension {
    id?: string;
    extension?: Extension[];
    url: undefined;
}

export interface BundleLink {
    id?: string;
    extension?: Extension[];
    modifierExtension?: Extension[];
    relation: string;
    url: uri;
}

export interface BundleEntry<R extends AidboxResource> {
    id?: string;
    extension?: Extension[];
    modifierExtension?: Extension[];
    link?: BundleLink[];
    fullUrl?: uri;
    resource?: R;
    search?: BundleEntrySearch;
    request?: BundleEntryRequest;
    response?: BundleEntryResponse<R>;
}

export interface BundleEntrySearch {
    id?: string;
    extension?: Extension[];
    modifierExtension?: Extension[];
    mode?: code;
    score?: decimal;
}

export interface BundleEntryRequest {
    id?: string;
    extension?: Extension[];
    modifierExtension?: Extension[];
    method: code;
    url: uri;
    ifNoneMatch?: string;
    ifModifiedSince?: instant;
    ifMatch?: string;
    ifNoneExist?: string;
}

export interface BundleEntryResponse<R extends AidboxResource> {
    id?: string;
    extension?: Extension[];
    modifierExtension?: Extension[];
    status: string;
    location?: uri;
    etag?: string;
    lastModified?: instant;
    outcome?: R;
}

export interface Signature {
    id?: string;
}

export interface Identifier {
    id?: string;
}

export interface Bundle<R extends AidboxResource> {
    readonly resourceType: 'Bundle';
    id?: id;
    meta?: Meta;
    implicitRules?: uri;
    language?: code;
    identifier?: Identifier;
    type: code;
    timestamp?: instant;
    total?: unsignedInt;
    link?: BundleLink[];
    entry?: Array<BundleEntry<R>>;
    signature?: Signature;
    params: BundleParam[];
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
