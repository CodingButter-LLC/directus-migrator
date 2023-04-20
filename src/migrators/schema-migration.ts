import CRUD, { Method } from "../utils/CRUD"
import logger from "../utils/Logger"
import { Environment } from "../types/types"

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
  const { data } = await CRUD({
    method: Method.GET,
    environment,
    path: "schema/snapshot",
    success: async (response: Response) => {
      logger.log("Schema Migration Snapshot Successful")
    },
    failure: async (response: Response) => {
      logger.warn(
        "Schema Migration Snapshot Failed",
        JSON.stringify(await response?.json(), null, 4)
      )
    },
  })
  return data
}

export async function getDiff(
  environment: Environment,
  snapshot: any,
  force?: boolean | undefined
) {
  return await CRUD({
    method: Method.POST,
    environment,
    path: "schema/diff",
    params: { force },
    data: snapshot,
    success: async (response: Response) => {
      logger.log("Migration Diff Successful")
    },
    failure: async (response: Response) => {
      logger.warn("Migration Diff Failed", JSON.stringify(await response?.json(), null, 4))
    },
  })
}

export async function applyDiff(environment: Environment, diff: any) {
  return await CRUD({
    method: Method.POST,
    environment,
    path: "schema/apply",
    data: diff,
    success: async (response: Response) => {
      logger.log("Migration Successful")
    },
    failure: async (response: Response) => {
      logger.log("Migration Failed", JSON.stringify(await response?.json(), null, 4))
    },
  })
}
