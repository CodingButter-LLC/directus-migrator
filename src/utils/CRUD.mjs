export const URL = (environment, path, params) => {
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

export const create = async ({ environment, path, bodyData, handleResponse, params }) => {
  const response = await fetch(URL(environment, path, params), {
    method: "POST",
    headers,
    body: JSON.stringify(bodyData),
  })
  if (handleResponse) return await handleResponse(response)
  return await response.json()
}

export const get = async ({ environment, path, handleResponse, params }) => {
  const response = await fetch(URL(environment, path, params))
  if (handleResponse) return await handleResponse(response)
  const jsonResponse = await response.json()
  return jsonResponse
}

export const update = async ({ environment, path, bodyData, handleResponse, params }) => {
  const response = await fetch(URL(environment, path, params), {
    method: "PATCH",
    headers,
    body: JSON.stringify(bodyData),
  })
  if (handleResponse) return await handleResponse(response)
  return await response.json()
}

export const remove = async ({ environment, path, bodyData, handleResponse, params }) => {
  const response = await fetch(URL(environment, path, params), {
    method: "DELETE",
    headers,
    body: JSON.stringify(bodyData),
  })
  if (handleResponse) return await handleResponse(response)
  return await response.json()
}
