import { Environment, Role, AdminIds } from "../types/types"
import CRUD, { Method } from "../utils/CRUD"
import logger from "../utils/Logger"

export interface RoleExecution {
  method: Method
  environment: Environment
  roles?: Partial<Role[]> | Partial<Role>
  id?: string
  successMessage?: (message: any) => string
  failMessage?: (message: any) => string
}

export function removeAdmin(roles: Role[]): [roles: Role[], adminId: string] {
  const adminId = roles.find((role) => role.name === "Administrator")?.id || ""
  return [roles.filter((role) => role.id !== adminId), adminId]
}

export async function getRoles(environment: Environment) {
  const { data }: { data: Role[] } = await CRUD({ method: Method.GET, environment, path: "roles" })
  logger.info("Retrieved Roles", JSON.stringify(data, null, 4))
  return data
}

export async function getRoleCategories(
  source: Environment,
  target: Environment
): Promise<{
  createdRoles: Role[]
  deletedRoles: Role[]
  adminIds: AdminIds
}> {
  const [sourceRoles, sourceAdminId] = removeAdmin(await getRoles(source))
  const [targetRoles, targetAdminId] = removeAdmin(await getRoles(target))
  const adminIds: AdminIds = { sourceAdminId, targetAdminId }
  const createdRoles = sourceRoles
    .filter(
      (sourceRole: Role) => !targetRoles.find((targetRole: Role) => sourceRole.id === targetRole.id)
    )
    .map((role) => {
      role.users = []
      return role
    })
  const deletedRoles = targetRoles.filter(
    (targetRole: Role) => !sourceRoles.find((sourceRole: Role) => sourceRole.id === targetRole.id)
  )
  return { createdRoles, deletedRoles, adminIds }
}
async function executeRoleAction({
  method,
  environment,
  roles,
  id,
  successMessage,
  failMessage,
}: RoleExecution) {
  logger.log("", `Executing ${method} on ${environment.name}...`)
  const roleResponse = await CRUD({
    method,
    environment,
    path: `permissions${id ? `/${id}` : ""}`,
    data: roles,
    success: async (response: Response) => {
      const jsonResponse = await response.json()
      successMessage && logger.log(successMessage(jsonResponse.data))
    },
    failure: async (response: Response) => {
      const jsonString = await response.json()
      failMessage && logger.error(failMessage(jsonString))
    },
  })
  return roleResponse
}
export async function migrate(source: Environment, target: Environment): Promise<AdminIds> {
  const { createdRoles, deletedRoles, adminIds } = await getRoleCategories(source, target)
  if (createdRoles.length > 0) {
    await executeRoleAction({
      method: Method.POST,
      roles: createdRoles,
      environment: target,
      successMessage: (roles: any) => `Created ${roles.length} Role/s`,
      failMessage: (message: any) => `Failed to create roles ${message}`,
    })
  }

  if (deletedRoles.length > 0) {
    await Promise.all(
      deletedRoles.map((role) => {
        const { id } = role
        executeRoleAction({
          method: Method.DELETE,
          environment: target,
          id,
          successMessage: (roles: any) => `Deleted ${roles.length} Role/s`,
          failMessage: (message: any) => `Failed to Delete roles \n${message}`,
        })
      })
    )
  }

  return adminIds
}
