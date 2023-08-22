import { AdminIds, Environment, Preset, Role } from "../types/types";
import CRUD, { Method } from "../utils/CRUD";
import { DeepCompareJson } from "../utils/Compare";
import logger from "../utils/Logger.js";

interface PresetExecution {
  method: Method;
  environment: Environment;
  presets?: Partial<Preset[]> | Partial<Preset> | number[] | number | undefined;
  id?: number | undefined;
  successMessage: (message: any) => string;
  failMessage: (message: any) => string;
}

function filterAndMutatePresets(presets: Preset[]): Preset[] {
  return presets;
  // const filteredPresets = presets.filter(
  //   ({ role, id }) => role != adminId && id != null
  // );
  // filteredPresets.forEach((preset) => {
  //   preset.uid = `${preset.collection}${preset.id}`;
  // });
  // return filteredPresets;
}

/**
 *
 * @param sourcePresets
 * @param targetPresets
 * @returns { createdPresets: Preset[], updatedPresets: Preset[], deletedPresets: Preset[]}
 * @description Compares the presets from the source and target using the uid(compiled from unique keys) environments and returns the presets that need to be created, updated and deleted
 */
function getPresetAction(
  sourcePresets: Preset[],
  targetPresets: Preset[]
): {
  createdPresets: Preset[];
  updatedPresets: Preset[];
  deletedPresets: Preset[];
} {
  const createdPresets = sourcePresets
    .filter((sourcePreset) => {
      return !targetPresets.find(({ uid }) => sourcePreset?.uid === uid);
    })
    .map((sourcePreset) => {
      const { uid, id, ...preset } = sourcePreset;
      return preset;
    });

  const updatedPresetsCandidates = sourcePresets
    .filter((sourcePreset) => {
      return targetPresets.find(({ uid }) => sourcePreset.uid === uid);
    })
    .map((sourcePreset) => {
      return {
        sourcePreset,
        targetPreset: targetPresets.find(({ uid }) => sourcePreset.uid === uid),
      };
    });

  //use deep compare to check if the presets are the same
  const updatedPresets = updatedPresetsCandidates
    .filter(({ sourcePreset, targetPreset }) => {
      const {
        uid: sourceUID,
        id: sourceID,
        ...sourcePresetWithoutID
      } = sourcePreset;
      const {
        uid: targetUID,
        id: targetID,
        ...targetPresetWithoutID
      } = targetPreset || { uuid: null, id: null };
      return !DeepCompareJson(sourcePresetWithoutID, targetPresetWithoutID);
    })
    .map(({ sourcePreset, targetPreset }) => {
      const { uid, id: sourceId, ...preset } = sourcePreset;
      const id = targetPreset?.id;
      return { ...preset, id };
    });

  const deletedPresets = targetPresets.filter((targetPreset) => {
    return !sourcePresets.find(({ uid }) => {
      return uid === targetPreset.uid;
    });
  });

  return { createdPresets, updatedPresets, deletedPresets };
}

async function getPresets(environment: Environment) {
  const privatePerms = await CRUD({
    method: Method.GET,
    environment,
    path: "presets",
    params: {
      "filter[id][_nnull]": true,
      "filter[role][_nnull]": true,
      limit: -1,
    },
  });

  const publicPresets = await CRUD({
    method: Method.GET,
    environment,
    path: "presets",
    params: {
      "filter[role][_null]": true,
      "filter[user][_null]": true,
      "filter[id][_nnull]": true,
      limit: -1,
    },
  });

  return [...privatePerms?.data, ...publicPresets?.data];
}

async function executePresetAction({
  method,
  environment,
  presets,
  id,
  successMessage,
  failMessage,
}: PresetExecution) {
  const roleResponse = await CRUD({
    method,
    environment,
    path: `presets${id ? `/${id}` : ""}`,
    data: presets,
  });
  logger.info(successMessage(roleResponse.data));
  return roleResponse.data;
}

/**
 * Runs the preset migration
 */
export async function presetMigrator(source: Environment, target: Environment) {
  logger.info("Migrating Presets");

  const targetPresets = filterAndMutatePresets(await getPresets(target));

  const sourcePresets = filterAndMutatePresets(await getPresets(source));

  if (sourcePresets.length > 0) {
    const { createdPresets, updatedPresets, deletedPresets } = getPresetAction(
      sourcePresets,
      targetPresets
    );

    logger.info(
      `Created: ${createdPresets.length}, Updated: ${updatedPresets.length}, Deleted: ${deletedPresets.length}`
    );

    if (createdPresets.length > 0) {
      await executePresetAction({
        method: Method.POST,
        environment: target,
        presets: createdPresets,
        successMessage: (_data: any[]) =>
          `Created ${createdPresets.length} Preset/s`,
        failMessage: (_response: any) => `Failed to create Preset`,
      });
    }

    if (updatedPresets.length > 0) {
      await Promise.all(
        updatedPresets.map(async (presets, index) => {
          const { id } = presets;
          return await executePresetAction({
            method: Method.PATCH,
            presets,
            environment: target,
            id,
            successMessage: (_data?: any) =>
              `Updated Preset ${index} with id:${id}`,
            failMessage: (_response: any) =>
              `Failed to Update Preset ${index} with id:${id}`,
          });
        })
      );
      logger.info(`Updated ${updatedPresets.length} Presets`);
      return true;
    }

    if (deletedPresets.length) {
      const ids = deletedPresets.map(({ id }) => id) as number[];
      await executePresetAction({
        method: Method.DELETE,
        environment: target,
        id: ids.length === 1 ? ids[0] : undefined,
        presets: ids.length > 1 ? ids : undefined,
        successMessage: (_data: any[]) => `Deleted ${ids.length} Preset/s`,
        failMessage: (_response: any) =>
          `Failed to delete ${ids.length} Preset/s`,
      });
    }
  }
  logger.info("Migrating Presets Complete");
}
