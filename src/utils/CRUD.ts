import { Environment } from "../types/types";
import logger from "../utils/Logger";

export enum Method {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  PUT = "PATCH",
  DELETE = "DELETE",
}

const headers = {
  "Content-Type": "application/json",
};
export interface CRUDInterface {
  environment: Environment;
  path: string;
  data?: any;
  handleResponse?: (response: Response) => Promise<any>;
  params?: any;
  method: Method;
  success?: (response: Response) => Promise<any>;
  failure?: (response: Response) => Promise<any>;
}

const URL = (environment: Environment, path: string, params: any) => {
  if (params)
    params = `&${Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join("&")}`;

  const url = `${environment.endpoint}/${path}?access_token=${
    environment.accessToken
  }${params ? params : ""}`;
  return url;
};

async function handleStatus(
  response: Response,
  handler?: (data: any) => any
): Promise<any> {
  if (!response.ok) return;
  const contentType = response.headers.get("content-type");
  let returnVal: any = null;
  if (contentType && contentType.indexOf("application/json") !== -1) {
    returnVal = await response.json();
  } else {
    returnVal = await response.text();
  }
  return (handler && handler(returnVal)) || returnVal;
}

export default async function CRUD({
  environment,
  path,
  data,
  params,
  method = Method.GET,
  success,
  failure,
}: CRUDInterface): Promise<any> {
  const url = URL(environment, path, params);
  logger.debug(JSON.stringify({ url, method, data }));
  const response = await fetch(url, {
    method,
    headers,
    body: data && JSON.stringify(data),
  });

  return response.ok
    ? handleStatus(response, success)
    : handleStatus(response, failure);
}
