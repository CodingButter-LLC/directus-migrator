import { Environment } from "../types/types"
import logger from "./Logger"

export enum Method {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  PUT = "PATCH",
  DELETE = "DELETE",
}

const headers = {
  "Content-Type": "application/json",
}
export interface CRUDInterface {
  environment: Environment
  path: string
  data?: any
  handleResponse?: (response: Response) => Promise<any>
  params?: any
  method: Method
  success?: (response: Response) => Promise<any>
  failure?: (response: Response) => Promise<any>
}

const URL = (environment: Environment, path: string, params: any) => {
  if (params)
    params = `&${Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join("&")}`

  const url = `${environment.endpoint}/${path}?access_token=${environment.accessToken}${
    params ? params : ""
  }`
  return url
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
  const response = await fetch(URL(environment, path, params), {
    method,
    headers,
    body: data && JSON.stringify(data),
  })
  if (response.ok) {
    try {
      const jsonResp = await response.json()
      success && success(response)
      return jsonResp
    } catch (err) {
      return await response.text()
    }
  } else {
    failure && failure(response)
    logger.warn("CRUD Failed", JSON.stringify(await response?.json(), null, 4))
    return false
  }
}
