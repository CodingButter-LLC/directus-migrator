import { url } from "inspector"
import { Environment } from "../types/types"
import logger from "../utils/Logger"
import fs from "fs"
import { resolve } from "path"

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

export interface FileCRUDInterface {
  filePath: string
  propertyName: string
  data?: any
  id?: string
  method: Method
}


export async function fileCRUD({
  filePath,
  propertyName,
  data,
  id,
  method = Method.GET }: FileCRUDInterface): Promise<any> {
  const directoryPath = resolve(__dirname, filePath.split("/").slice(0, -1).join("/"))
  const file = resolve(__dirname, filePath)
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "{}")
    }
  }
  const jsonData = JSON.parse(fs.readFileSync(file, "utf8"))
  if (method === Method.GET) {
    if (id) {
      return jsonData[propertyName].find((item: any) => item.id === id)
    }
    return jsonData[propertyName]
  }
  if (method === Method.POST || method === Method.PUT) {
    if (id) {
      const index = jsonData[propertyName].findIndex((item: any) => item.id === id)
      jsonData[propertyName][index] = { ...jsonData[propertyName][index], data }
      return jsonData[propertyName][index]
    }
    jsonData[propertyName] = { ...jsonData[propertyName], data }
    return jsonData[propertyName]
  }
  if (method === Method.DELETE) {
    if (id) {
      const index = jsonData[propertyName].findIndex((item: any) => item.id === id)
      jsonData[propertyName].splice(index, 1)
      return jsonData[propertyName]
    }
    delete jsonData[propertyName]
    return jsonData
  }
  fs.writeFileSync(file, JSON.stringify(jsonData))
  return jsonData
}



