import { create, get, update, remove } from "./utils/CRUD.mjs"
import logger from "./utils/Logger.mjs"
const permIDS = (permissions) => permissions.map(({ id }) => id)
const sanitizePermissions = (permissions) => {
  return permissions.map((permission) => {
    const sanitizedPermission = { ...permission }
    delete sanitizedPermission.id
    return sanitizedPermission
  })
}

export const swapRoleIds = (permissions, mergedRoles) => {
  return sanitizePermissions(permissions)
    .map((permission) => {
      const { role } = permission
      const mergedRole = mergedRoles.find((mergedRole) => mergedRole.sourceId === role)
      if (mergedRole) {
        return { ...permission, role: mergedRole.targetId }
      }
      return null
    })
    .filter((permission) => permission !== null)
}

export async function getPermissions(environment) {
  const privatePerms = await get({ environment, path: "permissions", params: { limit: -1 } })
  const publicPerms = await get({
    environment,
    path: "permissions",
    params: { "filter[role][_null]": true, limit: -1 },
  })
  return [...privatePerms.data, ...publicPerms.data]
}

export function getNullRolePermissions(permissions) {
  return permissions.filter((permission) => permission.role === null)
}

export async function removePermissions(environment, permissions) {
  const ids = permIDS(permissions).filter((id) => id)
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

export async function migrate(args, source, target, mergedRoles, force = false) {
  try {
    logger.setDebugLevel(args)
    const targetPermissions = await getPermissions(target)
    const sourcePermissions = await getPermissions(source)
    if (sourcePermissions.length) {
      const newPermissions = swapRoleIds(sourcePermissions, mergedRoles)
      const nullRolePermissions = sanitizePermissions(getNullRolePermissions(sourcePermissions))
      await removePermissions(target, targetPermissions)
      const response = await create({
        environment: target,
        path: "permissions",
        bodyData: [...newPermissions, ...nullRolePermissions],
        handleResponse: async (response) => {
          if (response.ok) {
            logger.log(`Created permissions`, JSON.stringify(await response.json(), null, 4))
            return true
          } else {
            logger.error(
              "Error Creating Permissions",
              JSON.stringify(await response.json(), null, 4)
            )
          }
        },
      })
    }
  } catch (err) {
    logger.error("Migration Failed: Are you sure there are changes to be made?", err)
  }
}
