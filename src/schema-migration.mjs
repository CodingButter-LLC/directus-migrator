import path from "path"
import { create, get, update, remove } from "./utils/CRUD.mjs"

let configArray

export const config = async (config = { path: "directus-migrator.config.mjs" }) => {
  const configPath = `${path.join(process.cwd(), config.path)}`
  if (!configArray) {
    const config = await import(`${configPath}`)
    configArray = config.default
  }
  return configArray
}

export async function migrate(source, target, force = false) {
  //check if source is a string

  try {
    const snapshot = await getSnapshot(source)
    const diff = await getDiff(target, snapshot, force)
    if (!diff) return { status: "no changes" }
    const applied = await applyDiff(target, diff)
    if (!applied) return { status: "failed" }
    return { status: "success" }
  } catch (err) {
    console.error("Migration Failed: Are you sure there are changes to be made?", err)
  }
}

export async function getSnapshot(environment) {
  const { data } = await get({ environment, path: "schema/snapshot" })
  return data
}

export async function getDiff(environment, snapshot, force) {
  return await create({
    environment,
    path: "schema/diff",
    params: { force },
    bodyData: snapshot,
    handleResponse: async (response) => {
      if (response.ok) {
        console.log("Migration Diff Successful")
        const jsonResponse = await response.json()
        return jsonResponse.data
      } else {
        console.warn("Migration Diff Failed")
        return false
      }
    },
  })
}

export async function applyDiff(environment, diff) {
  return await create({
    environment,
    path: "schema/apply",
    bodyData: diff,
    handleResponse: async (response) => {
      if (response.ok) {
        console.log("Migration Successful")
        return true
      } else {
        console.log("Migration Failed", JSON.stringify(await response.json(), null, 4))
        return false
      }
    },
  })
}
