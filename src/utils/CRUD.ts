import { Environment } from "../types/types"
import logger from "./Logger"

async function MiddleWare(
  environment: Environment,
  path: string,
  url: string,
  options?: any
): Promise<Response> {
  const response = await fetch(url, options)
  logger.table({
    Environment: environment.name,
    Endpoint: path,
    Method: options.method,
    URL: url,
    StatusCode: response?.status,
  })
  if (response.status >= 400) {
    process.exit(0)
  }
  return response
}

export interface CRUD {
  environment: Environment
  path: string
  bodyData?: any
  handleResponse?: (response: Response) => Promise<any>
  params?: any
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

const headers = {
  "Content-Type": "application/json",
}

export const create = async ({ environment, path, bodyData, handleResponse, params }: CRUD) => {
  const response = await MiddleWare(environment, path, URL(environment, path, params), {
    method: "POST",
    headers,
    body: bodyData && JSON.stringify(bodyData),
  })
  if (handleResponse) return await handleResponse(response)
  return await response.json()
}

export const get = async ({ environment, path, handleResponse, bodyData, params }: CRUD) => {
  const response = await MiddleWare(environment, path, URL(environment, path, params), {
    method: "GET",
    headers,
    body: bodyData && JSON.stringify(bodyData),
  })
  const jsonResponse = await response.json()
  if (!response.ok) {
    logger.error("GET Failed", JSON.stringify(jsonResponse, null, 4))
  }
  if (handleResponse) return await handleResponse(response)
  return jsonResponse
}

export const update = async ({ environment, path, bodyData, handleResponse, params }: CRUD) => {
  const response = await MiddleWare(environment, path, URL(environment, path, params), {
    method: "PATCH",
    headers,
    body: bodyData && JSON.stringify(bodyData),
  })
  if (handleResponse) return await handleResponse(response)
  return await response.json()
}

export const remove = async ({ environment, path, bodyData, handleResponse, params }: CRUD) => {
  const response = await MiddleWare(environment, path, URL(environment, path, params), {
    method: "DELETE",
    headers,
    body: bodyData && JSON.stringify(bodyData),
  })
  if (handleResponse) return await handleResponse(response)
  return await response.json()
}
