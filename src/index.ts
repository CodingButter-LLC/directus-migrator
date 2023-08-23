import { Environment, DirectusMigratorCommand } from "./types/types";
import {
  schemaMigrator,
  permissionMigrator,
  roleMigrator,
  flowsMigrator,
  presetMigrator,
  dashboardMigrator,
  panelMigrator,
  translationMigrator,
  webhookMigrator,
  settingMigrator,
} from "./migrators";
import logger from "./utils/Logger";

/**
 *  Runs the Directus Migration
 */

export async function directusMigrator(
  source: Environment,
  target: Environment,
  args: DirectusMigratorCommand
) {
  const {
    force = false,
    roles,
    permissions,
    flows,
    schema,
    presets,
    dashboards,
    translations,
    webhooks,
    settings,
  } = args;
  if (!source || !target) {
    logger.error("Source and Target Environments are required");
    return;
  }

  if (
    roles ||
    permissions ||
    schema ||
    flows ||
    presets ||
    dashboards ||
    translations ||
    webhooks ||
    settings
  ) {
    if (schema) {
      return await schemaMigrator(source, target, force);
    }
    if (flows) {
    }
    if (permissions) {
      const adminIds = await roleMigrator(source, target);
      await permissionMigrator(source, target, adminIds);
    }
    if (presets) {
      await presetMigrator(source, target);
    }

    if (dashboards) {
      await dashboardMigrator(source, target);
      await panelMigrator(source, target);
    }

    if (translations) {
      await translationMigrator(source, target);
    }

    if (webhooks) {
      await webhookMigrator(source, target);
    }

    if (settings) {
      await settingMigrator(source, target);
    }
  } else {
    await schemaMigrator(source, target, force);
    const adminIds = await roleMigrator(source, target);
    await permissionMigrator(source, target, adminIds);
    await flowsMigrator(source, target);
  }

  logger.info("Migration Completed!");
}
