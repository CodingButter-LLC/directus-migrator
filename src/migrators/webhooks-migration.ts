import { Environment, Webhook } from "../types/types";
import CRUD, { Method } from "../utils/CRUD";
import { DeepCompareJson } from "../utils/Compare";
import logger from "../utils/Logger.js";

interface WebhookExecution {
  method: Method;
  environment: Environment;
  webhooks?:
    | Partial<Webhook[]>
    | Partial<Webhook>
    | number[]
    | number
    | undefined;
  id?: number | undefined;
  successMessage: (message: any) => string;
  failMessage: (message: any) => string;
}

function filterAndMutateWebhooks(webhooks: Webhook[]): Webhook[] {
  return webhooks.map((webhook) => ({
    ...webhook,
    uid: `${webhook.id}`,
  }));
}

/**
 *
 * @param sourceWebhooks
 * @param targetWebhooks
 * @returns { createdWebhooks: Webhook[], updatedWebhooks: Webhook[], deletedWebhooks: Webhook[]}
 * @description Compares the webhooks from the source and target using the uid(compiled from unique keys) environments and returns the webhooks that need to be created, updated and deleted
 */
function getWebhookAction(
  sourceWebhooks: Webhook[],
  targetWebhooks: Webhook[]
): {
  createdWebhooks: Webhook[];
  updatedWebhooks: Webhook[];
  deletedWebhooks: Webhook[];
} {
  const createdWebhooks = sourceWebhooks
    .filter((sourceWebhook) => {
      return !targetWebhooks.find(({ uid }) => sourceWebhook?.uid === uid);
    })
    .map((sourceWebhook) => {
      const { uid, id, ...webhook } = sourceWebhook;
      return webhook;
    });

  const updatedWebhooksCandidates = sourceWebhooks
    .filter((sourceWebhook) => {
      return targetWebhooks.find(({ uid }) => sourceWebhook.uid === uid);
    })
    .map((sourceWebhook) => {
      return {
        sourceWebhook,
        targetWebhook: targetWebhooks.find(
          ({ uid }) => sourceWebhook.uid === uid
        ),
      };
    });

  //use deep compare to check if the webhooks are the same
  const updatedWebhooks = updatedWebhooksCandidates
    .filter(({ sourceWebhook, targetWebhook }) => {
      const {
        uid: sourceUID,
        id: sourceID,
        ...sourceWebhookWithoutID
      } = sourceWebhook;
      const {
        uid: targetUID,
        id: targetID,
        ...targetWebhookWithoutID
      } = targetWebhook || { uuid: null, id: null };
      return !DeepCompareJson(sourceWebhookWithoutID, targetWebhookWithoutID);
    })
    .map(({ sourceWebhook, targetWebhook }) => {
      const { uid, id: sourceId, ...webhook } = sourceWebhook;
      const id = targetWebhook?.id;
      return { ...webhook, id };
    });

  const deletedWebhooks = targetWebhooks.filter((targetWebhook) => {
    return !sourceWebhooks.find(({ uid }) => {
      return uid === targetWebhook.uid;
    });
  });

  return { createdWebhooks, updatedWebhooks, deletedWebhooks };
}

async function getWebhooks(environment: Environment) {
  const privateWebhooks = await CRUD({
    method: Method.GET,
    environment,
    path: "webhooks",
    params: {
      "filter[id][_nnull]": true,
      limit: -1,
    },
  });

  return privateWebhooks?.data;
}

async function clearWebhooks(environment: Environment, ids: number[]) {
  ids.forEach(async (id) => {
    await CRUD({
      method: Method.DELETE,
      environment,
      path: `webhooks${id ? `/${id}` : ""}`,
      params: {
        "filter[id][_nnull]": true,
        limit: -1,
      },
    });
  });
}

async function executeWebhookAction({
  method,
  environment,
  webhooks,
  id,
  successMessage,
  failMessage,
}: WebhookExecution) {
  const reqResponse = await CRUD({
    method,
    environment,
    path: `webhooks${id ? `/${id}` : ""}`,
    data: webhooks,
  });
  logger.info(successMessage(reqResponse.data));
  return reqResponse.data;
}

/**
 * Runs the webhook migration
 */
export async function webhookMigrator(
  source: Environment,
  target: Environment
) {
  logger.info("Migrating Webhooks");

  let targetWebhooks = filterAndMutateWebhooks(await getWebhooks(target));

  await clearWebhooks(
    target,
    targetWebhooks?.map((item) => item.id as number)
  );

  targetWebhooks = [];

  const sourceWebhooks = filterAndMutateWebhooks(await getWebhooks(source));

  if (sourceWebhooks.length > 0) {
    const { createdWebhooks, updatedWebhooks, deletedWebhooks } =
      getWebhookAction(sourceWebhooks, targetWebhooks);

    logger.info(
      `Created: ${createdWebhooks.length}, Updated: ${updatedWebhooks.length}, Deleted: ${deletedWebhooks.length}`
    );

    if (createdWebhooks.length > 0) {
      await executeWebhookAction({
        method: Method.POST,
        environment: target,
        webhooks: createdWebhooks,
        successMessage: (_data: any[]) =>
          `Created ${createdWebhooks.length} Webhook/s`,
        failMessage: (_response: any) => `Failed to create Webhook`,
      });
    }

    if (updatedWebhooks.length > 0) {
      await Promise.all(
        updatedWebhooks.map(async (webhooks, index) => {
          const { id } = webhooks;
          return await executeWebhookAction({
            method: Method.PATCH,
            webhooks,
            environment: target,
            id,
            successMessage: (_data?: any) =>
              `Updated Webhook ${index} with id:${id}`,
            failMessage: (_response: any) =>
              `Failed to Update Webhook ${index} with id:${id}`,
          });
        })
      );
      logger.info(`Updated ${updatedWebhooks.length} Webhooks`);
      return true;
    }

    if (deletedWebhooks.length) {
      const ids = deletedWebhooks.map(({ id }) => id) as number[];
      await executeWebhookAction({
        method: Method.DELETE,
        environment: target,
        id: ids.length === 1 ? ids[0] : undefined,
        webhooks: ids.length > 1 ? ids : undefined,
        successMessage: (_data: any[]) => `Deleted ${ids.length} Webhook/s`,
        failMessage: (_response: any) =>
          `Failed to delete ${ids.length} Webhook/s`,
      });
    }
  }
  logger.info("Migrating Webhooks Complete");
}
