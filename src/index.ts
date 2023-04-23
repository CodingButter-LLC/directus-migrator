import { AdminIds, Environment, DirectusMigratorCommand } from "./types/types"
import { SchemaMigrator, PermissionMigrator, RoleMigrator } from "./migrators"
import logger from "./utils/Logger"

const migrateSchema = async (source: Environment, target: Environment, force: boolean) => {
  try {
    await SchemaMigrator(source, target, force)
  } catch (e) {
    logger.error("Error while migrating schema", { error: e })
  }
}


export async function migrateRoles(source: Environment, target: Environment): Promise<AdminIds> {
  return await RoleMigrator(source, target)
}

export async function migratePermissions(
  source: Environment,
  target: Environment,
  adminIds: AdminIds
): Promise<void> {
  await PermissionMigrator(source, target, adminIds)
}

export async function DirectusMigrator(
  source: Environment,
  target: Environment,
  args: DirectusMigratorCommand
) {
  const { force = false, roles, permissions, schema } = args
  if (!source || !target) {
    logger.error("Source and Target Environments are required")
    return
  }
  if (roles || permissions || schema) {
    if (schema) {
      return await migrateSchema(source, target, force)
    }
    logger.info("Migrating Roles")
    const adminIds = await migrateRoles(source, target)
    logger.info("Migrating Roles Complete")
    if (permissions) {
      logger.info("Migrating Permissions")
      await migratePermissions(source, target, adminIds)
      logger.info("Migrating Permissions Complete")
    }
  } else {
    logger.info("Migrating Schema")
    await migrateSchema(source, target, force)
    logger.info("Migrating Roles")
    const adminIds = await migrateRoles(source, target)
    logger.info("Migrating Permissions")
    await migratePermissions(source, target, adminIds)
  }

  logger.info("Completed!")
}
