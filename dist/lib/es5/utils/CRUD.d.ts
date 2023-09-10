import { Environment } from "../types";
export declare enum Method {
    GET = "GET",
    POST = "POST",
    PATCH = "PATCH",
    PUT = "PATCH",
    DELETE = "DELETE"
}
export interface CRUDInterface {
    environment: Environment;
    path: string;
    data?: any;
    handleResponse?: (response: Response) => Promise<any>;
    params?: any;
    method: Method;
    ignoreErrors?: boolean;
}
export declare function logErrors(errors: any[], url: string): void;
export default function CRUD({ environment, path, data, params, method, ignoreErrors }: CRUDInterface): Promise<any>;
export interface FileCRUDInterface {
    filePath: string;
    propertyName: string;
    data?: any;
    id?: string;
    method: Method;
}
export declare function fileCRUD({ filePath, propertyName, data, id, method }: FileCRUDInterface): Promise<any>;
