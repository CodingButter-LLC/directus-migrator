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

export async function removePermissions(environment, permissions, mergedRoles) {
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
const removeAdminPermissions = (permissions, adminId) => {
  return permissions.filter((permission) => permission.role !== adminId)
}
export async function migrate(args, source, target, mergedRoles, force = false) {
  try {
    logger.setDebugLevel(args)
    const { sourceId, targetId } = mergedRoles?.find(({ name }) => name == "Administrator")
    const targetPermissions = removeAdminPermissions(await getPermissions(target), targetId)
    const sourcePermissions = removeAdminPermissions(await getPermissions(source), sourceId)
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
            return true
          } else {
            logger.error("Error Creating Permissions")
            logger.table(createRoles)
          }
        },
      })
    }
  } catch (err) {
    logger.error("Migration Failed: Are you sure there are changes to be made?", err)
  }
}
