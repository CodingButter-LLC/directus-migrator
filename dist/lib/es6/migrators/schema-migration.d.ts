import { Environment } from "../types";
/**
 * Runs the Schema Migration
 */
export declare function schemaMigrator(source: Environment, target: Environment, force?: boolean): Promise<any>;
export declare function getSnapshot(environment: Environment): Promise<any>;
export declare function getDiff(environment: Environment, snapshot: any, force?: boolean | undefined): Promise<any>;
export declare function applyDiff(environment: Environment, diff: any): Promise<any>;
