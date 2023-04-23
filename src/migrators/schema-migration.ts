import CRUD, { Method } from "../utils/CRUD"
import logger from "../utils/Logger"
import { Environment } from "../types/types"

export async function migrate(
  source: Environment,
  target: Environment,
  force?: boolean | undefined
) {
    logger.info("Migrating Schema Started")
    const snapshot = await getSnapshot(source)
    const diff = await getDiff(target, snapshot, force)
    if (!diff) return { status: "no changes" }
    const applied = await applyDiff(target, diff)
    if (!applied) return { status: "failed" }
    return { status: "success" }
}

export async function getSnapshot(environment: Environment) {
  const { data } = await CRUD({
    method: Method.GET,
    environment,
    path: "schema/snapshot",
    success: async (response: Response) => {
      logger.info("Source Schema Snapshot Successful")
    },
    failure: async (response: Response) => {
      logger.warn(`Schema Migration Snapshot Failed ${await response?.json()}`)
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
      logger.info("Migration Diff Successful")
    },
    failure: async (response: Response) => {
      logger.warn(`Migration Diff Failed ${await response?.json()}`)
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
      logger.info("Schema Migration Successful")
    },
    failure: async (response: Response) => {
      logger.info(`Schema Migration Failed ${await response?.json()}`)
    },
  })
}
