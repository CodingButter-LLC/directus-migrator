import { create, get, update, remove } from "./utils/CRUD.mjs"

/**
 *
 * @param {Array} roles
 * @returns {Array}
 * @description Removes id and users from roles
 */
export const sanitizeRoles = (roles) => {
  return roles.map((role) => {
    const sanitizedRole = { ...role }
    delete sanitizedRole.id
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
      if (jsonResponse.data) return jsonResponse.data
      return jsonResponse
    },
  })
  return roleResponse
}

export async function getRoles(environment) {
  const { data } = await get({ environment, path: "roles" })
  return data
}

export async function migrate(source, target, force = false) {
  try {
    let mergedRoles = []
    const { existingRoles, newRoles } = await parseRoles(source, target)
    mergedRoles = [...existingRoles]
    if (newRoles.length) {
      const createdRoles = await createRoles(target, sanitizeRoles(newRoles))
      mergedRoles = [...mergedRoles, ...mergeRoles(newRoles, createdRoles)]
    }
    return mergedRoles
  } catch (err) {
    console.log("Error Migrating Roles", err)
  }
}
