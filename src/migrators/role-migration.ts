import { Environment, Role, AdminIds } from "../types/types";
import CRUD, { Method } from "../utils/CRUD";
import logger from "../utils/Logger";

export interface RoleExecution {
  method: Method;
  environment: Environment;
  roles?: Partial<Role[]> | Partial<Role>;
  id?: string;
  successMessage: (message: any) => string;
  failMessage: (message: any) => string;
}

/**
 * Runs the Role Migration
 */
export async function roleMigrator(
  source: Environment,
  target: Environment
): Promise<AdminIds> {
  logger.info("Migrating Roles");
  const { createdRoles, deletedRoles, adminIds } = await getRoleCategories(
    source,
    target
  );
  if (createdRoles.length > 0) {
    logger.info(
      `Created: ${createdRoles.length}, Deleted: ${deletedRoles.length}`
    );

    await executeRoleAction({
      method: Method.POST,
      roles: createdRoles,
      environment: target,
      successMessage: (roles: any) => `Created ${roles.length} Role/s`,
      failMessage: (message: any) => `Failed to create roles\n ${message}`,
    });
  }

  if (deletedRoles.length > 0) {
    await Promise.all(
      deletedRoles.map((role) => {
        const { id } = role;
        executeRoleAction({
          method: Method.DELETE,
          environment: target,
          id,
          successMessage: (roles: any) => `Deleted ${roles.length} Role/s`,
          failMessage: (message: any) => `Failed to Delete roles\n ${message}`,
        });
      })
    );
  }
  logger.info("Migrating Roles Complete");
  return adminIds;
}

export function removeAdmin(roles: Role[]): [roles: Role[], adminId: string] {
  const adminId = roles.find((role) => role.name === "Administrator")?.id || "";
  return [roles.filter((role) => role.id !== adminId), adminId];
}

export async function getRoles(environment: Environment) {
  const roleResponse = await CRUD({
    method: Method.GET,
    environment,
    path: "roles",
  });
  if (!roleResponse)
    logger.error(`Failed to retrieve Roles from ${environment.name}`);
  logger.info(`Retrieved Roles from ${environment.name}`);
  return roleResponse?.data;
}

export async function getRoleCategories(
  source: Environment,
  target: Environment
): Promise<{
  createdRoles: Role[];
  deletedRoles: Role[];
  adminIds: AdminIds;
}> {
  const [sourceRoles, sourceAdminId] = removeAdmin(await getRoles(source));
  const [targetRoles, targetAdminId] = removeAdmin(await getRoles(target));
  const adminIds: AdminIds = { sourceAdminId, targetAdminId };
  const createdRoles = sourceRoles
    .filter(
      (sourceRole: Role) =>
        !targetRoles.find((targetRole: Role) => sourceRole.id === targetRole.id)
    )
    .map((role) => {
      role.users = [];
      return role;
    });
  const deletedRoles = targetRoles.filter(
    (targetRole: Role) =>
      !sourceRoles.find((sourceRole: Role) => sourceRole.id === targetRole.id)
  );
  return { createdRoles, deletedRoles, adminIds };
}

async function executeRoleAction({
  method,
  environment,
  roles,
  id,
  successMessage,
  failMessage,
}: RoleExecution) {
  logger.info("", `Executing ${method} on ${environment.name}...`);
  const roleResponse = await CRUD({
    method,
    environment,
    path: `roles${id ? `/${id}` : ""}`,
    data: roles,
  });
  if (!roleResponse) throw new Error(failMessage(roleResponse));
  logger.info(successMessage(roleResponse.data));
  return roleResponse.data;
}
