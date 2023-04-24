import { AdminIds, Environment, DirectusMigratorCommand } from "./types/types";
import { SchemaMigrator, PermissionMigrator, RoleMigrator } from "./migrators";
import logger from "./utils/Logger";

export async function DirectusMigrator(
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
      return await SchemaMigrator(source, target, force);
    }
    const adminIds = await RoleMigrator(source, target);
    if (permissions) {
      await PermissionMigrator(source, target, adminIds);
    }
  } else {
    await SchemaMigrator(source, target, force);
    const adminIds = await RoleMigrator(source, target);
    await PermissionMigrator(source, target, adminIds);
  }

  logger.info("Migration Completed!");
}
