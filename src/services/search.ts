export type SearchParam<T> = T | T[] | undefined;

export interface SearchParams {
    [key: string]: SearchParam<string | number | boolean>;
}
