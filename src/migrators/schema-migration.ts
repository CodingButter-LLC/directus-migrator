import CRUD, { Method } from "../utils/CRUD";
import logger from "../utils/Logger";
import { Environment } from "../types/types";

export async function migrate(
  source: Environment,
  target: Environment,
  force?: boolean
): Promise<any> {
  logger.info("Migrating Schema Started");
  const snapshot = await getSnapshot(source);
  if (!snapshot) {
    logger.error("Schema Migration Snapshot Failed");
    return;
  }
  const diff = await getDiff(target, snapshot, force);
  if (!diff) logger.warn("No Schema Diff Found");
  const applied = await applyDiff(target, diff);
  if (!applied) {
    logger.error("Schema Migration Failed");
    return;
  }
  logger.info("Schema Migration Successful");
  return;
}

export async function getSnapshot(environment: Environment) {
  const snapshot = await CRUD({
    method: Method.GET,
    environment,
    path: "schema/snapshot",
    success: async (response: Response) => {
      logger.info("Source Schema Snapshot Successful");
    },
    failure: async (response: Response) => {
      logger.warn(`Schema Migration Snapshot Failed ${await response?.json()}`);
    },
  });
  return snapshot?.data;
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
      logger.info("Migration Diff Successful");
    },
    failure: async (response: Response) => {
      logger.warn(`Migration Diff Failed ${await response?.json()}`);
    },
  });
}

export async function applyDiff(environment: Environment, diff: any) {
  return await CRUD({
    method: Method.POST,
    environment,
    path: "schema/apply",
    data: diff,
    success: async (response: Response) => {
      logger.info("Schema Migration Successful");
    },
    failure: async (response: Response) => {
      logger.warn(`Schema Migration Failed ${await response?.json()}`);
    },
  });
}
