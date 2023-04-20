import { AdminIds, Environment, Permission, Role } from "../types/types"
import { create, get, update, remove, CRUD } from "../utils/CRUD"
import logger from "../utils/Logger.js"

interface PermissionExecution {
  action: (crud: CRUD) => Promise<any>
  environment: Environment
  permissions?: Partial<Permission[]> | Partial<Permission> | number[]
  id?: number
  successMessage?: (message: any) => string
  failMessage?: (message: any) => string
}

function removeUnwantedPermissions(permissions: Permission[], adminId: string): Permission[] {
  return permissions.filter(({ role, id }) => role !== adminId || id !== null)
}

function getPermissionAction(
  sourcePermissions: Permission[],
  targetPermissions: Permission[]
): {
  createdPermissions: Permission[]
  updatedPermissions: Permission[]
  deletedPermissions: Permission[]
} {
  const createdPermissions = sourcePermissions.filter((sourcePermission) => {
    return !targetPermissions.find(({ id }) => sourcePermission.id === id)
  })

  const updatedPermissions = sourcePermissions.filter((sourcePermission) => {
    return targetPermissions.find(({ id }) => sourcePermission.id === id)
  })

  const deletedPermissions = targetPermissions.filter((targetPermission) => {
    return !sourcePermissions.find(({ id }) => {
      return id === targetPermission.id
    })
  })

  return { createdPermissions, updatedPermissions, deletedPermissions }
}

async function getPermissions(environment: Environment) {
  const privatePerms = await get({
    environment,
    path: "permissions",
    params: { "filter[id][_null]": false, "filter[role][_null]": false, limit: -1 },
  })
  const publicPerms = await get({
    environment,
    path: "permissions",
    params: { "filter[role][_null]": true, "filter:[id][_null]": false, limit: -1 },
  })
  return [...privatePerms?.data, ...publicPerms?.data]
}

async function executePermissionAction({
  action,
  environment,
  permissions,
  id,
  successMessage,
  failMessage,
}: PermissionExecution) {
  logger.log("", `Executing ${action.name} on ${environment.name}...`)
  logger.log("", `Permissions: ${JSON.stringify(permissions, null, 4)}`)
  const roleResponse = await action({
    environment,
    path: `permissions${id ? `/${id}` : ""}`,
    bodyData: permissions,
    handleResponse: async (response: Response) => {
      const jsonResponse = await response.json()
      const jsonString = JSON.stringify(jsonResponse, null, 4)
      if (!response.ok) {
        failMessage && logger.error(failMessage(jsonString))
      } else {
        const { data } = jsonResponse
        if (data) {
          if (successMessage) {
            logger.log(successMessage(data))
            logger.table(data)
          }
          return data
        } else {
          failMessage && logger.error(failMessage(jsonString))
        }
      }
    },
  })
  return roleResponse
}

export async function migrate(source: Environment, target: Environment, adminIds: AdminIds) {
  const targetPermissions = removeUnwantedPermissions(
    await getPermissions(target),
    adminIds.targetAdminId
  )

  const sourcePermissions = removeUnwantedPermissions(
    await getPermissions(source),
    adminIds.sourceAdminId
  )

  if (sourcePermissions.length > 0) {
    const { createdPermissions, updatedPermissions, deletedPermissions } = getPermissionAction(
      sourcePermissions,
      targetPermissions
    )
    logger.table({
      Created: createdPermissions.length,
      Updated: updatedPermissions.length,
      Deleted: deletedPermissions.length,
    })
    if (createdPermissions.length > 0) {
      await executePermissionAction({
        action: create,
        environment: target,
        permissions: createdPermissions,
        successMessage: (_data: any[]) => `Created ${createdPermissions.length} Permission/s`,
        failMessage: (message: any) => `Failed to create Permission: ${message}`,
      })
    }

    if (updatedPermissions.length > 0) {
      await Promise.all(
        updatedPermissions.map(async (permissions) => {
          const { id } = permissions
          return await executePermissionAction({
            action: update,
            permissions,
            environment: target,
            id,
            successMessage: (_data?: any) => `Updated ${updatedPermissions.length} Permission/s`,
            failMessage: (message: any) => `Failed to Update Permission: ${message}`,
          })
        })
      )
      logger.log("Permissions Updated", updatedPermissions)
    }

    if (deletedPermissions.length) {
      const ids = deletedPermissions.map(({ id }) => id)
      await executePermissionAction({
        action: remove,
        environment: target,
        permissions: ids,
        successMessage: (permissions: any) => `Deleted ${permissions.length} Permission/s`,
        failMessage: (message: any) => `Failed to Delete Permission: ${message}`,
      })
    }
  }
}
