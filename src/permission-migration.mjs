import { create, get, update, remove } from "./utils/CRUD.mjs"

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
  const { data } = await get({ environment, path: "permissions" })
  return data
}

export async function removePermissions(environment, permissions) {
  const ids = permIDS(permissions)
  const response = await remove({
    environment,
    path: "permissions",
    bodyData: ids,
    handleResponse: async (response) => {
      if (response.ok) {
        console.log(`Removed permissions`)
        return true
      } else {
        console.log(`Failed to remove permissions`)
        return false
      }
    },
  })
}

export async function migrate(source, target, mergedRoles, force = false) {
  try {
    const targetPermissions = await getPermissions(target)
    const sourcePermissions = await getPermissions(source)
    if (sourcePermissions.length) {
      const newPermissions = swapRoleIds(sourcePermissions, mergedRoles)
      const response = await create({
        environment: target,
        path: "permissions",
        bodyData: newPermissions,
        handleResponse: async (response) => {
          if (response.ok) {
            console.log(`Created permissions`)
            if (force) {
              await removePermissions(source, sourcePermissions)
            }
            return true
          } else {
            console.log(`Failed to create permissions`)
            return false
          }
        },
      })
    }
  } catch (err) {
    console.log("Migration Failed: Are you sure there are changes to be made?", err)
  }
}
