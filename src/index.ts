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
  logger.setDebugLevel(args)
  const { force = false, roles, permissions, schema } = args

  if (roles || permissions || schema) {
    if (schema) return await migrateSchema(source, target, force)
    const adminIds = await migrateRoles(source, target)
    logger.table(adminIds)
    if (permissions) await migratePermissions(source, target, adminIds)
  } else {
    await migrateSchema(source, target, force)
    const adminIds = await migrateRoles(source, target)
    await migratePermissions(source, target, adminIds)
  }

  console.log("Completed!")
}
