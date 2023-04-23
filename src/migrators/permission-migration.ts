import { AdminIds, Environment, Permission, Role } from "../types/types"
import CRUD, { Method } from "../utils/CRUD"
import logger from "../utils/Logger.js"
logger.level
interface PermissionExecution {
  method: Method
  environment: Environment
  permissions?: Partial<Permission[]> | Partial<Permission> | number[]
  id?: number
  successMessage?: (message: any) => string
  failMessage?: (message: any) => string
}

async function removeUnwantedPermissions(permissions: Permission[], adminId: string): Promise<Permission[]> {
  return permissions.filter(({ role, id }) => role != adminId && id != null)
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
  const privatePerms = await CRUD({
    method: Method.GET,
    environment,
    path: "permissions",
    params: { "filter[id][_nnull]": true, "filter[role][_nnull]": true, limit: -1 },
  })
  const publicPerms = await CRUD({
    method: Method.GET,
    environment,
    path: "permissions",
    params: { "filter[role][_null]": true, "filter[id][_nnull]": true, limit: -1 },
  })
  return [...privatePerms?.data, ...publicPerms?.data]
}

async function executePermissionAction({
  method,
  environment,
  permissions,
  id,
  successMessage,
  failMessage,
}: PermissionExecution) {
  const roleResponse = await CRUD({
    method,
    environment,
    path: `permissions${id ? `/${id}` : ""}`,
    data: permissions,
    success: async (data:any) => {
        successMessage && logger.info(successMessage(data))
    },
    failure: async (data) => {
      failMessage && logger.error(failMessage(data))
    },
  })
  return roleResponse
}

export async function migrate(source: Environment, target: Environment, adminIds: AdminIds) {
  
  const targetPermissions = await removeUnwantedPermissions(
    await getPermissions(target),
    adminIds.targetAdminId
  )

  const sourcePermissions = await removeUnwantedPermissions(
    await getPermissions(source),
    adminIds.sourceAdminId
  )

  if (sourcePermissions.length > 0) {
    const { createdPermissions, updatedPermissions, deletedPermissions } = getPermissionAction(
      sourcePermissions,
      targetPermissions
    )

    logger.info(
`Created: ${createdPermissions.length}, Updated: ${updatedPermissions.length}, Deleted: ${deletedPermissions.length}`)
    
    if (createdPermissions.length > 0) {
      await executePermissionAction({
        method: Method.POST,
        environment: target,
        permissions: createdPermissions,
        successMessage: (_data: any[]) => `Created ${createdPermissions.length} Permission/s`,
        failMessage: (message: any) => `Failed to create Permission: ${message}`,
      })
    }

    if (updatedPermissions.length > 0) {
      await Promise.all(
        updatedPermissions.map(async (permissions, index) => {
          const { id } = permissions
          return await executePermissionAction({
            method: Method.PATCH,
            permissions,
            environment: target,
            id,
            successMessage: (_data?: any) => `Updated Permission ${index} with id:${id}`,
            failMessage: (message: any) => `Failed to Update Permission: ${message}`,
          })
        })
      )
      logger.info("Permissions Updated", updatedPermissions)
    }

    if (deletedPermissions.length) {
      const ids = deletedPermissions.map(({ id }) => id)
      await executePermissionAction({
        method: Method.DELETE,
        environment: target,
        permissions: ids,
        successMessage: (permissions: any) => `Deleted ${permissions.length} Permission/s`,
        failMessage: (message: any) => `Failed to Delete Permission: ${message}`,
      })
    }
  }
}
