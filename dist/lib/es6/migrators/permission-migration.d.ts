import { AdminIds, Environment } from "../types";
/**
 * Runs the permission migration
 */
export declare function permissionMigrator(source: Environment, target: Environment, adminIds: AdminIds): Promise<boolean>;
