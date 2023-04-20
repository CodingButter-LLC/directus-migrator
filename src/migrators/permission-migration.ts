import { AdminIds, Environment, Permission, Role } from "../types/types"
import { create, get, update, remove, CRUD } from "../utils/CRUD"
import logger from "../utils/Logger.js"

interface PermissionExecution {
  action: (crud: CRUD) => Promise<any>
  environment: Environment
  permissions?: Partial<Permission[]> | Partial<Permission> | number[]
  id?: number
  successMessage?: string
  failMessage?: string
}

function permIDS(permissions: Permission[]): number[] {
  return permissions
    .filter((permission) => permission.id)
    ?.map((permission) => permission.id) as number[]
}

function removeAdminPermissions(permissions: Permission[], adminId: string): Permission[] {
  return permissions.filter(({ role }) => role !== adminId)
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
    return !targetPermissions.find((targetPermission) => {
      return sourcePermission.id === targetPermission.id
    })
  })

  const updatedPermissions = sourcePermissions.filter((sourcePermission) => {
    return targetPermissions.find((targetPermission) => {
      return sourcePermission.id === targetPermission.id
    })
  })

  const deletedPermissions = targetPermissions.filter((targetPermission) => {
    return !sourcePermissions.find((sourcePermission) => {
      return sourcePermission.id === targetPermission.id
    })
  })

  return { createdPermissions, updatedPermissions, deletedPermissions }
}

async function getPermissions(environment: Environment) {
  const privatePerms = await get({ environment, path: "permissions", params: { limit: -1 } })
  const publicPerms = await get({
    environment,
    path: "permissions",
    params: { "filter[role][_null]": true, limit: -1 },
  })
  return [...privatePerms.data, ...publicPerms.data]
}

async function executePermissionAction({
  action,
  environment,
  permissions,
  id,
  successMessage,
  failMessage,
}: PermissionExecution) {
  const roleResponse = await action({
    environment,
    path: `permissions${id ? `/${id}` : ""}`,
    bodyData: permissions,
    handleResponse: async (response: Response) => {
      if (!response.ok) {
        failMessage && logger.error(failMessage)
        return null
      } else {
        const jsonResponse = await response.json()
        successMessage && logger.log(successMessage, jsonResponse.data)
        if (jsonResponse.data) return jsonResponse.data
        return jsonResponse
      }
    },
  })
  return roleResponse
}

export async function migrate(source: Environment, target: Environment, adminIds: AdminIds) {
  const targetPermissions = removeAdminPermissions(
    await getPermissions(target),
    adminIds.targetAdminId
  )

  const sourcePermissions = removeAdminPermissions(
    await getPermissions(source),
    adminIds.sourceAdminId
  )

  if (sourcePermissions.length) {
    const { createdPermissions, updatedPermissions, deletedPermissions } = getPermissionAction(
      sourcePermissions,
      targetPermissions
    )

    if (createdPermissions.length) {
      await executePermissionAction({
        action: create,
        environment: target,
        permissions: createdPermissions,
        successMessage: "Created Permissions",
        failMessage: "Failed to create Permissions",
      })
    }

    if (updatedPermissions.length) {
      await Promise.all(
        updatedPermissions.map((permission) => {
          const { id, ...data } = permission
          return executePermissionAction({
            action: update,
            environment: target,
            id,
            permissions: data,
            failMessage: `Failed to update Permissions ${id}`,
          })
        })
      )
      logger.log("Permissions Updated", permIDS(updatedPermissions))
    }

    if (deletedPermissions.length) {
      await executePermissionAction({
        action: remove,
        environment: target,
        permissions: permIDS(deletedPermissions),
        successMessage: "Deleted Permissions",
        failMessage: "Failed to delete Permissions",
      })
    }
  }
}
