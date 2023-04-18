import { create, get, update, remove } from "./utils/CRUD.mjs"
import logger from "./utils/Logger.mjs"
/**
 *
 * @param {Array} roles
 * @returns {Array}
 * @description Removes id and users from roles
 */
export const sanitizeRoles = (roles) => {
  return roles.map((role) => {
    const sanitizedRole = { ...role }
    //delete sanitizedRole.id
    delete sanitizedRole.users
    return sanitizedRole
  })
}

export const mergeRoles = (sourceRoles, targetRoles) => {
  const mergedRoles = sourceRoles
    .filter((sourceRole) => {
      const target = targetRoles.find((targetRole) => targetRole.name === sourceRole.name)
      if (target) return true
      return false
    })
    .map((sourceRole) => {
      const target = targetRoles.find((targetRole) => targetRole.name === sourceRole.name)
      return { name: sourceRole.name, sourceId: sourceRole.id, targetId: target.id }
    })

  return mergedRoles
}

export async function parseRoles(source, target) {
  const sourceRoles = await getRoles(source)
  const targetRoles = await getRoles(target)
  const existingRoles = mergeRoles(sourceRoles, targetRoles)
  const newRoles = sourceRoles.filter(
    (sourceRole) => !existingRoles.find((existingRole) => existingRole.name === sourceRole.name)
  )

  return { existingRoles, newRoles }
}

export async function createRoles(environment, roles) {
  const roleResponse = await create({
    environment,
    path: "roles",
    bodyData: roles,
    handleResponse: async (response) => {
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

export async function getRoles(environment) {
  const { data } = await get({ environment, path: "roles" })
  logger.info("Retrieved Roles", JSON.stringify(data, null, 4))
  return data
}

export async function migrate(args, source, target, force = false) {
  try {
    logger.setDebugLevel(args)
    let mergedRoles = []
    const { existingRoles, newRoles } = await parseRoles(source, target)
    mergedRoles = [...existingRoles]
    if (newRoles.length) {
      const createdRoles = await createRoles(target, sanitizeRoles(newRoles))
      mergedRoles = [...mergedRoles, ...mergeRoles(newRoles, createdRoles)]
    }
    logger.info("Merged Roles")
    logger.table(mergedRoles)
    return mergedRoles
  } catch (err) {
    logger.error("Error Migrating Roles", err)
  }
}
