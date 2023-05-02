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

export function logErrors(errors: any[], url: string) {
  logger.error(`Error in ${url}`)
  errors.forEach((error) => {
    logger.error(error)
  })
  process.exit()
}

export default async function CRUD({
  environment,
  path,
  data,
  params,
  method = Method.GET,
}: CRUDInterface): Promise<any> {
  const url = URL(environment, path, params)
  logger.warn(JSON.stringify({ url, method, data }))
  const response = await fetch(url, {
    method,
    headers,
    body: data && JSON.stringify(data),
  })
  //check if response status is empty
  if (response.status === 204) return false
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
