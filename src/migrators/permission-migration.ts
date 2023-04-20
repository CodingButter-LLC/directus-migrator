import { Environment, Permission, Role } from "../types/types"
import { create, get, update, remove } from "../utils/CRUD"
import { DirectusMigratorCommand } from "../"
import logger from "../utils/Logger.js"

function permIDS(permissions: Permission[]) {
  return permissions.map(({ id }) => id)
}

function sanitizePermissions(permissions: Permission[]) {
  return permissions.map((permission) => {
    const sanitizedPermission = { ...permission }
    delete sanitizedPermission.id
    return sanitizedPermission
  })
}

export async function getPermissions(environment: Environment) {
  const privatePerms = await get({ environment, path: "permissions", params: { limit: -1 } })
  const publicPerms = await get({
    environment,
    path: "permissions",
    params: { "filter[role][_null]": true, limit: -1 },
  })
  return [...privatePerms.data, ...publicPerms.data]
}

export function getNullRolePermissions(permissions: Permission[]) {
  return permissions.filter((permission) => permission.role === null)
}

export async function removePermissions(environment: Environment, permissions: Permission[]) {
  const ids = permIDS(permissions).filter((id) => id)
  logger.log("Remove Permission ids")
  logger.table(ids)
  const response = await remove({
    environment,
    path: "permissions",
    bodyData: ids,
    handleResponse: async (response) => {
      if (response.ok) {
        logger.log(`Removed permissions`)
        return true
      } else {
        logger.error(JSON.stringify(await response.json(), null, 4))
      }
    },
  })
  return response
}

function removeAdminPermissions(permissions: Permission[], roles: Role[]) {
  const adminId = roles?.find((role: Role) => role.name === "Administrator")?.id
  return permissions.filter((permission: Permission) => permission.id !== adminId)
}

export async function migrate(
  args: DirectusMigratorCommand,
  source: Environment,
  target: Environment,
  sourceRoles: Role[],
  targetRoles: Role[]
) {
  try {
    logger.setDebugLevel(args)
    const targetPermissions = removeAdminPermissions(await getPermissions(target), targetRoles)
    const sourcePermissions = removeAdminPermissions(await getPermissions(source), sourceRoles)
    if (sourcePermissions.length) {
      const newPermissions = sanitizePermissions(sourcePermissions) //swapRoleIds(sourcePermissions, mergedRoles)
      logger.log("New Permissions")
      logger.table(newPermissions)
      const nullRolePermissions = sanitizePermissions(getNullRolePermissions(sourcePermissions))
      await removePermissions(target, targetPermissions)
      const createRoles = [...newPermissions, ...nullRolePermissions]
      logger.log("Create Permissions")
      logger.table(createRoles)
      const response = await create({
        environment: target,
        path: "permissions",
        bodyData: createRoles,
        handleResponse: async (response) => {
          if (response.ok) {
            logger.log(`Created permissions`)
            logger.table(createRoles)
            return await response.json()
          } else {
            logger.error("Error Creating Permissions")
            logger.table(createRoles)
            return []
          }
        },
      })
    }
  } catch (err) {
    logger.error("Migration Failed: Are you sure there are changes to be made?", err)
  }
}
