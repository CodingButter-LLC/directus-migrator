import { Environment, Panel } from "../types/types";
import CRUD, { Method } from "../utils/CRUD";
import { DeepCompareJson } from "../utils/Compare";
import logger from "../utils/Logger.js";

interface PanelExecution {
  method: Method;
  environment: Environment;
  panels?: Partial<Panel[]> | Partial<Panel> | string[] | string | undefined;
  id?: string | undefined;
  successMessage: (message: any) => string;
  failMessage: (message: any) => string;
}

function filterAndMutatePanels(panels: Panel[]): Panel[] {
  return panels.map((panel) => ({
    ...panel,
    uid: `${panel.id}`,
  }));
}

/**
 *
 * @param sourcePanels
 * @param targetPanels
 * @returns { createdPanels: Panel[], updatedPanels: Panel[], deletedPanels: Panel[]}
 * @description Compares the panels from the source and target using the uid(compiled from unique keys) environments and returns the panels that need to be created, updated and deleted
 */
function getPanelAction(
  sourcePanels: Panel[],
  targetPanels: Panel[]
): {
  createdPanels: Panel[];
  updatedPanels: Panel[];
  deletedPanels: Panel[];
} {
  const createdPanels = sourcePanels
    .filter((sourcePanel) => {
      return !targetPanels.find(({ uid }) => sourcePanel?.uid === uid);
    })
    .map((sourcePanel) => {
      const { uid, id, ...panel } = sourcePanel;
      return panel;
    });

  const updatedPanelsCandidates = sourcePanels
    .filter((sourcePanel) => {
      return targetPanels.find(({ uid }) => sourcePanel.uid === uid);
    })
    .map((sourcePanel) => {
      return {
        sourcePanel,
        targetPanel: targetPanels.find(({ uid }) => sourcePanel.uid === uid),
      };
    });

  //use deep compare to check if the panels are the same
  const updatedPanels = updatedPanelsCandidates
    .filter(({ sourcePanel, targetPanel }) => {
      const {
        uid: sourceUID,
        id: sourceID,
        ...sourcePanelWithoutID
      } = sourcePanel;
      const {
        uid: targetUID,
        id: targetID,
        ...targetPanelWithoutID
      } = targetPanel || { uuid: null, id: null };
      return !DeepCompareJson(sourcePanelWithoutID, targetPanelWithoutID);
    })
    .map(({ sourcePanel, targetPanel }) => {
      const { uid, id: sourceId, ...panel } = sourcePanel;
      const id = targetPanel?.id;
      return { ...panel, id };
    });

  const deletedPanels = targetPanels.filter((targetPanel) => {
    return !sourcePanels.find(({ uid }) => {
      return uid === targetPanel.uid;
    });
  });

  return { createdPanels, updatedPanels, deletedPanels };
}

async function getPanels(environment: Environment) {
  const privatePanels = await CRUD({
    method: Method.GET,
    environment,
    path: "panels",
    params: {
      "filter[id][_nnull]": true,
      limit: -1,
    },
  });

  return privatePanels?.data;
}

async function clearPanels(environment: Environment, ids: string[]) {
  ids.forEach(async (id) => {
    await CRUD({
      method: Method.DELETE,
      environment,
      path: `panels${id ? `/${id}` : ""}`,
      params: {
        "filter[id][_nnull]": true,
        limit: -1,
      },
    });
  });
}

async function executePanelAction({
  method,
  environment,
  panels,
  id,
  successMessage,
  failMessage,
}: PanelExecution) {
  const reqResponse = await CRUD({
    method,
    environment,
    path: `panels${id ? `/${id}` : ""}`,
    data: panels,
  });
  logger.info(successMessage(reqResponse.data));
  return reqResponse.data;
}

/**
 * Runs the panel migration
 */
export async function panelMigrator(source: Environment, target: Environment) {
  logger.info("Migrating Panels");

  let targetPanels = filterAndMutatePanels(await getPanels(target));

  await clearPanels(
    target,
    targetPanels?.map((item) => item.id as string)
  );

  targetPanels = [];

  const sourcePanels = filterAndMutatePanels(await getPanels(source));

  if (sourcePanels.length > 0) {
    const { createdPanels, updatedPanels, deletedPanels } = getPanelAction(
      sourcePanels,
      targetPanels
    );

    logger.info(
      `Created: ${createdPanels.length}, Updated: ${updatedPanels.length}, Deleted: ${deletedPanels.length}`
    );

    if (createdPanels.length > 0) {
      await executePanelAction({
        method: Method.POST,
        environment: target,
        panels: createdPanels,
        successMessage: (_data: any[]) =>
          `Created ${createdPanels.length} Panel/s`,
        failMessage: (_response: any) => `Failed to create Panel`,
      });
    }

    if (updatedPanels.length > 0) {
      await Promise.all(
        updatedPanels.map(async (panels, index) => {
          const { id } = panels;
          return await executePanelAction({
            method: Method.PATCH,
            panels,
            environment: target,
            id,
            successMessage: (_data?: any) =>
              `Updated Panel ${index} with id:${id}`,
            failMessage: (_response: any) =>
              `Failed to Update Panel ${index} with id:${id}`,
          });
        })
      );
      logger.info(`Updated ${updatedPanels.length} Panels`);
      return true;
    }

    if (deletedPanels.length) {
      const ids = deletedPanels.map(({ id }) => id) as string[];
      await executePanelAction({
        method: Method.DELETE,
        environment: target,
        id: ids.length === 1 ? ids[0] : undefined,
        panels: ids.length > 1 ? ids : undefined,
        successMessage: (_data: any[]) => `Deleted ${ids.length} Panel/s`,
        failMessage: (_response: any) =>
          `Failed to delete ${ids.length} Panel/s`,
      });
    }
  }
  logger.info("Migrating Panels Complete");
}
