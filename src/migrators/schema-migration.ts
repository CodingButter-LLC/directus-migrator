import { create, get } from "../utils/CRUD.js"
import logger from "../utils/Logger.js"
import { Environment } from "../types/types.js"

export async function migrate(
  source: Environment,
  target: Environment,
  force?: boolean | undefined
) {
  try {
    const snapshot = await getSnapshot(source)
    const diff = await getDiff(target, snapshot, force)
    if (!diff) return { status: "no changes" }
    const applied = await applyDiff(target, diff)
    if (!applied) return { status: "failed" }
    return { status: "success" }
  } catch (err) {
    logger.warn("Migration Failed: Are you sure there are changes to be made?", err)
  }
}

export async function getSnapshot(environment: Environment) {
  const { data } = await get({ environment, path: "schema/snapshot" })
  return data
}

export async function getDiff(
  environment: Environment,
  snapshot: any,
  force?: boolean | undefined
) {
  return await create({
    environment,
    path: "schema/diff",
    params: { force },
    bodyData: snapshot,
    handleResponse: async (response: Response) => {
      if (response.ok) {
        logger.log("Migration Diff Successful")
        const jsonResponse = await response.json()
        return jsonResponse.data
      } else {
        logger.warn("Migration Diff Failed")
        return false
      }
    },
  })
}

export async function applyDiff(environment: Environment, diff: any) {
  return await create({
    environment,
    path: "schema/apply",
    bodyData: diff,
    handleResponse: async (response: Response) => {
      if (response.ok) {
        logger.log("Migration Successful")
        return true
      } else {
        logger.log("Migration Failed", JSON.stringify(await response?.json(), null, 4))
        return false
      }
    },
  })
}
