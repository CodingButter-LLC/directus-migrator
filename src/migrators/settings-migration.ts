import { Environment, Setting } from "../types/types";
import CRUD, { Method } from "../utils/CRUD";
import { DeepCompareJson } from "../utils/Compare";
import logger from "../utils/Logger.js";

interface SettingExecution {
  method: Method;
  environment: Environment;
  settings?:
    | Partial<Setting[]>
    | Partial<Setting>
    | number[]
    | number
    | undefined;
  id?: number | undefined;
  successMessage: (message: any) => string;
  failMessage: (message: any) => string;
}

function filterAndMutateSettings(settings: any): Setting[] {
  return [settings].map((setting) => ({
    ...setting,
    uid: `${setting.id}`,
  }));
}

/**
 *
 * @param sourceSettings
 * @param targetSettings
 * @returns { createdSettings: Setting[], updatedSettings: Setting[], deletedSettings: Setting[]}
 * @description Compares the settings from the source and target using the uid(compiled from unique keys) environments and returns the settings that need to be created, updated and deleted
 */
function getSettingAction(
  sourceSettings: Setting[],
  targetSettings: Setting[]
): {
  createdSettings: Setting[];
  updatedSettings: Setting[];
  deletedSettings: Setting[];
} {
  const createdSettings = sourceSettings
    .filter((sourceSetting) => {
      return !targetSettings.find(({ uid }) => sourceSetting?.uid === uid);
    })
    .map((sourceSetting) => {
      const { uid, id, ...setting } = sourceSetting;
      return setting;
    });

  const updatedSettingsCandidates = sourceSettings
    .filter((sourceSetting) => {
      return targetSettings.find(({ uid }) => sourceSetting.uid === uid);
    })
    .map((sourceSetting) => {
      return {
        sourceSetting,
        targetSetting: targetSettings.find(
          ({ uid }) => sourceSetting.uid === uid
        ),
      };
    });

  //use deep compare to check if the settings are the same
  const updatedSettings = updatedSettingsCandidates
    .filter(({ sourceSetting, targetSetting }) => {
      const {
        uid: sourceUID,
        id: sourceID,
        ...sourceSettingWithoutID
      } = sourceSetting;
      const {
        uid: targetUID,
        id: targetID,
        ...targetSettingWithoutID
      } = targetSetting || { uuid: null, id: null };
      return !DeepCompareJson(sourceSettingWithoutID, targetSettingWithoutID);
    })
    .map(({ sourceSetting, targetSetting }) => {
      const { uid, id: sourceId, ...setting } = sourceSetting;
      const id = targetSetting?.id;
      return { ...setting, id };
    });

  const deletedSettings = targetSettings.filter((targetSetting) => {
    return !sourceSettings.find(({ uid }) => {
      return uid === targetSetting.uid;
    });
  });

  return { createdSettings, updatedSettings, deletedSettings };
}

async function getSettings(environment: Environment) {
  const privateSettings = await CRUD({
    method: Method.GET,
    environment,
    path: "settings",
    params: {
      "filter[id][_nnull]": true,
      fields: [
        "id",
        "auth_login_attempts",
        "auth_password_policy",
        "storage_asset_transform",
        "storage_asset_presets",
        "custom_css",
        "storage_default_folder",
        "basemaps",
        "custom_aspect_ratios",
        "module_bar"
      ],
      limit: -1,
    },
  });
  return privateSettings?.data;
}

async function executeSettingAction({
  method,
  environment,
  settings,
  id,
  successMessage,
  failMessage,
}: SettingExecution) {
  const reqResponse = await CRUD({
    method,
    environment,
    path: `settings`,
    data: settings,
  });
  logger.info(successMessage(reqResponse.data));
  return reqResponse.data;
}

/**
 * Runs the setting migration
 */
export async function settingMigrator(
  source: Environment,
  target: Environment
) {
  logger.info("Migrating Settings");

  const targetSettings = filterAndMutateSettings(await getSettings(target));

  const sourceSettings = filterAndMutateSettings(await getSettings(source));

  if (sourceSettings.length > 0) {
    const { createdSettings, updatedSettings, deletedSettings } =
      getSettingAction(sourceSettings, targetSettings);

    logger.info(
      `Created: ${createdSettings.length}, Updated: ${updatedSettings.length}, Deleted: ${deletedSettings.length}`
    );

    if (createdSettings.length > 0) {
      await executeSettingAction({
        method: Method.POST,
        environment: target,
        settings: createdSettings,
        successMessage: (_data: any[]) =>
          `Created ${createdSettings.length} Setting/s`,
        failMessage: (_response: any) => `Failed to create Setting`,
      });
    }

    if (updatedSettings.length > 0) {
      await Promise.all(
        updatedSettings.map(async (settings, index) => {
          const { id } = settings;
          return await executeSettingAction({
            method: Method.PATCH,
            settings,
            environment: target,
            id,
            successMessage: (_data?: any) =>
              `Updated Setting ${index} with id:${id}`,
            failMessage: (_response: any) =>
              `Failed to Update Setting ${index} with id:${id}`,
          });
        })
      );
      logger.info(`Updated ${updatedSettings.length} Settings`);
      return true;
    }

    if (deletedSettings.length) {
      const ids = deletedSettings.map(({ id }) => id) as number[];
      await executeSettingAction({
        method: Method.DELETE,
        environment: target,
        id: ids.length === 1 ? ids[0] : undefined,
        settings: ids.length > 1 ? ids : undefined,
        successMessage: (_data: any[]) => `Deleted ${ids.length} Setting/s`,
        failMessage: (_response: any) =>
          `Failed to delete ${ids.length} Setting/s`,
      });
    }
  }
  logger.info("Migrating Settings Complete");
}
