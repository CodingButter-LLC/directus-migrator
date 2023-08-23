import { Environment, Dashboard } from "../types/types";
import CRUD, { Method } from "../utils/CRUD";
import { DeepCompareJson } from "../utils/Compare";
import logger from "../utils/Logger.js";

interface DashboardExecution {
  method: Method;
  environment: Environment;
  dashboards?:
    | Partial<Dashboard[]>
    | Partial<Dashboard>
    | string[]
    | string
    | undefined;
  id?: string | undefined;
  successMessage: (message: any) => string;
  failMessage: (message: any) => string;
}

function filterAndMutateDashboards(dashboards: Dashboard[]): Dashboard[] {
  return dashboards.map((dashboard) => ({
    ...dashboard,
    uid: `${dashboard.id}`,
  }));
}

/**
 *
 * @param sourceDashboards
 * @param targetDashboards
 * @returns { createdDashboards: Dashboard[], updatedDashboards: Dashboard[], deletedDashboards: Dashboard[]}
 * @description Compares the dashboards from the source and target using the uid(compiled from unique keys) environments and returns the dashboards that need to be created, updated and deleted
 */
function getDashboardAction(
  sourceDashboards: Dashboard[],
  targetDashboards: Dashboard[]
): {
  createdDashboards: Dashboard[];
  updatedDashboards: Dashboard[];
  deletedDashboards: Dashboard[];
} {
  const createdDashboards = sourceDashboards
    .filter((sourceDashboard) => {
      return !targetDashboards.find(({ uid }) => sourceDashboard?.uid === uid);
    })
    .map((sourceDashboard) => {
      const { uid, id, ...dashboard } = sourceDashboard;
      return dashboard;
    });

  const updatedDashboardsCandidates = sourceDashboards
    .filter((sourceDashboard) => {
      return targetDashboards.find(({ uid }) => sourceDashboard.uid === uid);
    })
    .map((sourceDashboard) => {
      return {
        sourceDashboard,
        targetDashboard: targetDashboards.find(
          ({ uid }) => sourceDashboard.uid === uid
        ),
      };
    });

  //use deep compare to check if the dashboards are the same
  const updatedDashboards = updatedDashboardsCandidates
    .filter(({ sourceDashboard, targetDashboard }) => {
      const {
        uid: sourceUID,
        id: sourceID,
        ...sourceDashboardWithoutID
      } = sourceDashboard;
      const {
        uid: targetUID,
        id: targetID,
        ...targetDashboardWithoutID
      } = targetDashboard || { uuid: null, id: null };
      return !DeepCompareJson(
        sourceDashboardWithoutID,
        targetDashboardWithoutID
      );
    })
    .map(({ sourceDashboard, targetDashboard }) => {
      const { uid, id: sourceId, ...dashboard } = sourceDashboard;
      const id = targetDashboard?.id;
      return { ...dashboard, id };
    });

  const deletedDashboards = targetDashboards.filter((targetDashboard) => {
    return !sourceDashboards.find(({ uid }) => {
      return uid === targetDashboard.uid;
    });
  });

  return { createdDashboards, updatedDashboards, deletedDashboards };
}

async function getDashboards(environment: Environment) {
  const privateDashboards = await CRUD({
    method: Method.GET,
    environment,
    path: "dashboards",
    params: {
      "filter[id][_nnull]": true,
      limit: -1,
    },
  });

  return privateDashboards?.data;
}

async function clearDashboards(environment: Environment, ids: string[]) {
  ids.forEach(async (id) => {
    await CRUD({
      method: Method.DELETE,
      environment,
      path: `dashboards${id ? `/${id}` : ""}`,
      params: {
        "filter[id][_nnull]": true,
        limit: -1,
      },
    });
  });
}

async function executeDashboardAction({
  method,
  environment,
  dashboards,
  id,
  successMessage,
  failMessage,
}: DashboardExecution) {
  const reqResponse = await CRUD({
    method,
    environment,
    path: `dashboards${id ? `/${id}` : ""}`,
    data: dashboards,
  });
  logger.info(successMessage(reqResponse.data));
  return reqResponse.data;
}

/**
 * Runs the dashboard migration
 */
export async function dashboardMigrator(
  source: Environment,
  target: Environment
) {
  logger.info("Migrating Dashboards");

  let targetDashboards = filterAndMutateDashboards(await getDashboards(target));

  await clearDashboards(
    target,
    targetDashboards?.map((item) => item.id as string)
  );

  targetDashboards = [];

  const sourceDashboards = filterAndMutateDashboards(
    await getDashboards(source)
  );

  if (sourceDashboards.length > 0) {
    const { createdDashboards, updatedDashboards, deletedDashboards } =
      getDashboardAction(sourceDashboards, targetDashboards);

    logger.info(
      `Created: ${createdDashboards.length}, Updated: ${updatedDashboards.length}, Deleted: ${deletedDashboards.length}`
    );

    if (createdDashboards.length > 0) {
      await executeDashboardAction({
        method: Method.POST,
        environment: target,
        dashboards: createdDashboards,
        successMessage: (_data: any[]) =>
          `Created ${createdDashboards.length} Dashboard/s`,
        failMessage: (_response: any) => `Failed to create Dashboard`,
      });
    }

    if (updatedDashboards.length > 0) {
      await Promise.all(
        updatedDashboards.map(async (dashboards, index) => {
          const { id } = dashboards;
          return await executeDashboardAction({
            method: Method.PATCH,
            dashboards,
            environment: target,
            id,
            successMessage: (_data?: any) =>
              `Updated Dashboard ${index} with id:${id}`,
            failMessage: (_response: any) =>
              `Failed to Update Dashboard ${index} with id:${id}`,
          });
        })
      );
      logger.info(`Updated ${updatedDashboards.length} Dashboards`);
      return true;
    }

    if (deletedDashboards.length) {
      const ids = deletedDashboards.map(({ id }) => id) as string[];
      await executeDashboardAction({
        method: Method.DELETE,
        environment: target,
        id: ids.length === 1 ? ids[0] : undefined,
        dashboards: ids.length > 1 ? ids : undefined,
        successMessage: (_data: any[]) => `Deleted ${ids.length} Dashboard/s`,
        failMessage: (_response: any) =>
          `Failed to delete ${ids.length} Dashboard/s`,
      });
    }
  }
  logger.info("Migrating Dashboards Complete");
}
