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
  console.table(ids)
  const response = await remove({
    environment,
    path: "permissions",
    bodyData: ids,
    handleResponse: async (response) => {
      if (response.ok) {
        console.log(`Removed permissions`)
        return true
      } else {
        throw new Error(JSON.stringify(await response.json(), null, 4))
      }
    },
  })
  return response
}

export async function migrate(source, target, mergedRoles, force = false) {
  try {
    console.log("merged roles")
    console.table(mergedRoles)
    const targetPermissions = await getPermissions(target)
    const sourcePermissions = await getPermissions(source)
    if (sourcePermissions.length) {
      const newPermissions = swapRoleIds(sourcePermissions, mergedRoles)
      console.log("New Permissions")
      console.table(newPermissions)
      const nullRolePermissions = sanitizePermissions(getNullRolePermissions(sourcePermissions))
      console.log("Null Role Permissions")
      console.table(nullRolePermissions)
      await removePermissions(target, targetPermissions)
      const response = await create({
        environment: target,
        path: "permissions",
        bodyData: [...newPermissions, ...nullRolePermissions],
        handleResponse: async (response) => {
          if (response.ok) {
            console.log(`Created permissions`)
            return true
          } else {
            throw new Error("Error Creating Permissions", {
              cause: JSON.stringify(await response.json(), null, 4),
            })
          }
        },
      })
    }
  } catch (err) {
    console.log("Migration Failed: Are you sure there are changes to be made?", err)
  }
}
