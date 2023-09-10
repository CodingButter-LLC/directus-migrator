import { Environment, DirectusMigratorCommand } from "./types";
/**
 *  Runs the Directus Migration
 */
export declare function directusMigrator(source: Environment, target: Environment, args: DirectusMigratorCommand): Promise<any>;
