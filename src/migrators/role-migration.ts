import { Environment, Role } from "../types/types"
import { create, get, update, remove, CRUD } from "../utils/CRUD"
import logger from "../utils/Logger"

/**
 *
 * @param {Array} roles
 * @returns {Array}
 * @description Removes id and users from roles
 */
export function sanitizeRoles(roles: Role[]): Partial<Role[]> {
  return roles.filter((role) => role.name !== "Administrator")
}

export async function getRoles(environment: Environment) {
  const crudData: CRUD = { environment, path: "roles" }
  const { data }: { data: Role[] } = await get(crudData)
  logger.info("Retrieved Roles", JSON.stringify(data, null, 4))
  return data
}

export function swapUsers(sourceRoles: Role[], targetRoles: Role[]): Role[] {
  return sourceRoles.map((sourceRole: Role) => {
    const targetRole = targetRoles.find((targetRole: Role) => targetRole.name === sourceRole.name)
    if (targetRole) {
      return { ...sourceRole, users: targetRole.users }
    }
    return { ...sourceRole, users: [] }
  })
}

export async function getRoleCategories(
  source: Environment,
  target: Environment
): Promise<{
  updatedRoles: Role[]
  createdRoles: Role[]
  deletedRoles: Role[]
}> {
  const sourceRoles = await getRoles(source)
  const targetRoles = await getRoles(target)
  const createdRoles = sourceRoles.filter(
    (soureRole: Role) => !targetRoles.find((targetRole: Role) => soureRole.name === targetRole.name)
  )
  const updatedRoles = sourceRoles.filter((soureRole: Role) =>
    targetRoles.find((targetRole: Role) => soureRole.name === targetRole.name)
  )
  const deletedRoles = targetRoles.filter(
    (targetRole: Role) => !sourceRoles.find((soureRole: Role) => soureRole.name === targetRole.name)
  )
  return { updatedRoles, createdRoles, deletedRoles }
}

export async function executeRoleAction(
  action: (crud: CRUD) => Promise<any>,
  environment: Environment,
  roles: Partial<Role[]>
) {
  const roleResponse = await action({
    environment,
    path: "roles",
    bodyData: roles,
    handleResponse: async (response: Response) => {
      if (!response.ok) {
        throw new Error(`Failed to create roles`)
      }
      const jsonResponse = await response.json()
      logger.log("Created Roles", jsonResponse.data)
      if (jsonResponse.data) return jsonResponse.data
      return jsonResponse
    },
  })
  return roleResponse
}

export async function migrate(source: Environment, target: Environment): Promise<Partial<Role>[]> {
  try {
    const { createdRoles, updatedRoles, deletedRoles } = await getRoleCategories(source, target)
    if (createdRoles.length) {
      await executeRoleAction(create, target, createdRoles)
    }
    if (updatedRoles.length) {
      await executeRoleAction(update, target, updatedRoles)
    }
    if (deletedRoles.length) {
      await executeRoleAction(remove, target, deletedRoles)
    }
    return [...createdRoles, ...updatedRoles]
  } catch (err) {
    logger.error("Error Migrating Roles", err)
  }
  return []
}
