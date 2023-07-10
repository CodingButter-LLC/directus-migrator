import CRUD, { Method } from "../utils/CRUD";
import logger from "../utils/Logger";
import { Environment } from "../types/types";

/**
 * Runs the Schema Migration
 */
export async function schemaMigrator(
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
  if (!diff) {
    logger.warn("No Schema Diff Found");
    return true
  }
  const applied = await applyDiff(target, diff);
  if (!applied) {
    logger.error("Schema Migration Failed - Failed to apply");
    return false
  }

  logger.info("Schema Migration Successful");
  return true
}

export async function getSnapshot(environment: Environment) {
  const snapShot = await CRUD({
    method: Method.GET,
    environment,
    path: "schema/snapshot",
  });
  logger.info("Schema Migration Snapshot Successful");
  return snapShot?.data;
}

export async function getDiff(
  environment: Environment,
  snapshot: any,
  force?: boolean | undefined
) {
  const diff = await CRUD({
    method: Method.POST,
    environment,
    path: "schema/diff",
    params: { force },
    data: snapshot,
  });

  logger.info("Schema Migration Diff Successful");
  return diff?.data || diff;
}

export async function applyDiff(environment: Environment, diff: any) {
  return await CRUD({
    method: Method.POST,
    environment,
    path: "schema/apply",
    data: diff,
  });
}
