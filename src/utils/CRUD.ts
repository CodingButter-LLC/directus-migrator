import { url } from "inspector"
import { Environment } from "../types/types"
import logger from "../utils/Logger"

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
  ignoreErrors?: boolean
}

const URL = (environment: Environment, path: string, params: any) => {
  params = params || {}
  let urlSearchParams = `access_token=${environment.accessToken}&`;
  Object.keys(params).forEach((key) => {
    if (Array.isArray(params[key])) {
      urlSearchParams += params[key].reduce((acc: string, value: string) => {
        return acc + `${key}[]=${value}&`
      }, "")
    } else {
      urlSearchParams += `${key}=${params[key]}&`
    }
  })
  urlSearchParams = urlSearchParams.slice(0, -1)
  return `${environment.endpoint}/${path}?${urlSearchParams}`
}

export function logErrors(errors: any[], url: string) {
  logger.error(`Error in ${url}`)
  errors.forEach((error) => {
    logger.error(error)
  })
}

export default async function CRUD({
  environment,
  path,
  data,
  params,
  method = Method.GET,
  ignoreErrors = false
}: CRUDInterface): Promise<any> {
  const url = URL(environment, path, params)
  logger.debug(JSON.stringify({ url, method, data }))
  const response = await fetch(url, {
    method,
    headers,
    body: data && JSON.stringify(data),
  })
  //check if response status is empty
  if (response.status === 204) {
    return false
  }
  try {
    const json = await response.json()
    if (json.errors) {
      logErrors(json.errors, url)
    }
    return json
  } catch (e) {
    logErrors([e], url)
  }
}
