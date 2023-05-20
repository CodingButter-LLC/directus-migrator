import { AdminIds, Environment, DirectusMigratorCommand } from "./types/types";
import { schemaMigrator, permissionMigrator, roleMigrator } from "./migrators";
import logger from "./utils/Logger";

/**
 *  Runs the Directus Migration
 */
export async function directusMigrator(
  source: Environment,
  target: Environment,
  args: DirectusMigratorCommand
) {
  const { force = false, roles, permissions, schema } = args;
  if (!source || !target) {
    logger.error("Source and Target Environments are required");
    return;
  }
  if (roles || permissions || schema) {
    if (schema) {
      return await schemaMigrator(source, target, force);
    }
    const adminIds = await roleMigrator(source, target);
    if (permissions) {
      await permissionMigrator(source, target, adminIds);
    }
  } else {
    await schemaMigrator(source, target, force);
    const adminIds = await roleMigrator(source, target);
    await permissionMigrator(source, target, adminIds);
  }

  logger.info("Migration Completed!");
}
