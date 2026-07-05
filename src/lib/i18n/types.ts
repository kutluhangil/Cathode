export type Lang = "tr" | "en";

/** Nested string tablosu — yaprak değer string ya da interpolasyonlu string. */
export type Dict = { [key: string]: string | Dict };

export type TParams = Record<string, string | number>;
