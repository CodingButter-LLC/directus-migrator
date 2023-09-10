import { Environment, Role, AdminIds } from "../types";
import { Method } from "../utils/CRUD";
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
export declare function roleMigrator(source: Environment, target: Environment): Promise<AdminIds>;
export declare function removeAdmin(roles: Role[]): [roles: Role[], adminId: string];
export declare function getRoles(environment: Environment): Promise<any>;
export declare function getRoleCategories(source: Environment, target: Environment): Promise<{
    createdRoles: Role[];
    deletedRoles: Role[];
    adminIds: AdminIds;
}>;
