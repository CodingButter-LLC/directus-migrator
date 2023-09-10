import { AdminIds, Environment, Permission, Role } from "../types";
import CRUD, { Method } from "../utils/CRUD";
import { DeepCompareJson } from "../utils/Compare";
import logger from "../utils/Logger.js";

interface PermissionExecution {
  method: Method;
  environment: Environment;
  permissions?:
  | Partial<Permission[]>
  | Partial<Permission>
  | number[]
  | number
  | undefined;
  id?: number | undefined;
  successMessage: (message: any) => string;
  failMessage: (message: any) => string;
}

function filterAndMutatePermissions(
  permissions: Permission[],
  adminId: string
): Permission[] {
  const filteredPermissions = permissions.filter(
    ({ role, id }) => role != adminId && id != null
  );
  filteredPermissions.forEach((permission) => {
    permission.uid = `${permission.role}${permission.collection}${permission.action}`;
  });
  return filteredPermissions;
}

/**
 *
 * @param sourcePermissions
 * @param targetPermissions
 * @returns { createdPermissions: Permission[], updatedPermissions: Permission[], deletedPermissions: Permission[]}
 * @description Compares the permissions from the source and target using the uid(compiled from unique keys) environments and returns the permissions that need to be created, updated and deleted
 */
function getPermissionAction(
  sourcePermissions: Permission[],
  targetPermissions: Permission[]
): {
  createdPermissions: Permission[];
  updatedPermissions: Permission[];
  deletedPermissions: Permission[];
} {
  const createdPermissions = sourcePermissions
    .filter((sourcePermission) => {
      return !targetPermissions.find(
        ({ uid }) => sourcePermission?.uid === uid
      );
    })
    .map((sourcePermission) => {
      const { uid, id, ...permission } = sourcePermission;
      return permission;
    });

  const updatedPermissionsCandidates = sourcePermissions
    .filter((sourcePermission) => {
      return targetPermissions.find(({ uid }) => sourcePermission.uid === uid);
    })
    .map((sourcePermission) => {
      return {
        sourcePermission,
        targetPermission: targetPermissions.find(
          ({ uid }) => sourcePermission.uid === uid
        ),
      };
    });

  //use deep compare to check if the permissions are the same
  const updatedPermissions = updatedPermissionsCandidates
    .filter(({ sourcePermission, targetPermission }) => {
      const {
        uid: sourceUID,
        id: sourceID,
        ...sourcePermissionWithoutID
      } = sourcePermission;
      const {
        uid: targetUID,
        id: targetID,
        ...targetPermissionWithoutID
      } = targetPermission || { uuid: null, id: null };
      return !DeepCompareJson(
        sourcePermissionWithoutID,
        targetPermissionWithoutID
      );
    })
    .map(({ sourcePermission, targetPermission }) => {
      const { uid, id: sourceId, ...permission } = sourcePermission;
      const id = targetPermission?.id;
      return { ...permission, id };
    });

  const deletedPermissions = targetPermissions.filter((targetPermission) => {
    return !sourcePermissions.find(({ uid }) => {
      return uid === targetPermission.uid;
    });
  });

  return { createdPermissions, updatedPermissions, deletedPermissions };
}

async function getPermissions(environment: Environment) {
  const privatePerms = await CRUD({
    method: Method.GET,
    environment,
    path: "permissions",
    params: {
      "filter[id][_nnull]": true,
      "filter[role][_nnull]": true,
      limit: -1,
    },
  });

  const publicPerms = await CRUD({
    method: Method.GET,
    environment,
    path: "permissions",
    params: {
      "filter[role][_null]": true,
      "filter[id][_nnull]": true,
      limit: -1,
    },
  });

  return [...privatePerms?.data, ...publicPerms?.data];
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
  });
  logger.info(successMessage(roleResponse.data));
  return roleResponse.data;
}

/**
 * Runs the permission migration
 */
export async function permissionMigrator(
  source: Environment,
  target: Environment,
  adminIds: AdminIds
) {
  logger.info("Migrating Permissions");

  const targetPermissions = filterAndMutatePermissions(
    await getPermissions(target),
    adminIds.targetAdminId
  );

  const sourcePermissions = filterAndMutatePermissions(
    await getPermissions(source),
    adminIds.sourceAdminId
  );

  if (sourcePermissions.length > 0) {
    const { createdPermissions, updatedPermissions, deletedPermissions } =
      getPermissionAction(sourcePermissions, targetPermissions);

    logger.info(
      `Created: ${createdPermissions.length}, Updated: ${updatedPermissions.length}, Deleted: ${deletedPermissions.length}`
    );

    if (createdPermissions.length > 0) {
      await executePermissionAction({
        method: Method.POST,
        environment: target,
        permissions: createdPermissions,
        successMessage: (_data: any[]) =>
          `Created ${createdPermissions.length} Permission/s`,
        failMessage: (_response: any) => `Failed to create Permission`,
      });
    }

    if (updatedPermissions.length > 0) {
      await Promise.all(
        updatedPermissions.map(async (permissions, index) => {
          const { id } = permissions;
          return await executePermissionAction({
            method: Method.PATCH,
            permissions,
            environment: target,
            id,
            successMessage: (_data?: any) =>
              `Updated Permission ${index} with id:${id}`,
            failMessage: (_response: any) =>
              `Failed to Update Permission ${index} with id:${id}`,
          });
        })
      );
      logger.info(`Updated ${updatedPermissions.length} Permissions`);
      return true;
    }

    if (deletedPermissions.length) {
      const ids = deletedPermissions.map(({ id }) => id) as number[];
      await executePermissionAction({
        method: Method.DELETE,
        environment: target,
        id: ids.length === 1 ? ids[0] : undefined,
        permissions: ids.length > 1 ? ids : undefined,
        successMessage: (_data: any[]) => `Deleted ${ids.length} Permission/s`,
        failMessage: (_response: any) =>
          `Failed to delete ${ids.length} Permission/s`,
      });
    }
  }
  logger.info("Migrating Permissions Complete");
}
