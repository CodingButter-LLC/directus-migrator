import { Environment, Translation } from "../types/types";
import CRUD, { Method } from "../utils/CRUD";
import { DeepCompareJson } from "../utils/Compare";
import logger from "../utils/Logger.js";

interface TranslationExecution {
  method: Method;
  environment: Environment;
  translations?:
    | Partial<Translation[]>
    | Partial<Translation>
    | string[]
    | string
    | undefined;
  id?: string | undefined;
  successMessage: (message: any) => string;
  failMessage: (message: any) => string;
}

function filterAndMutateTranslations(
  translations: Translation[]
): Translation[] {
  return translations.map((translation) => ({
    ...translation,
    uid: `${translation.id}`,
  }));
}

/**
 *
 * @param sourceTranslations
 * @param targetTranslations
 * @returns { createdTranslations: Translation[], updatedTranslations: Translation[], deletedTranslations: Translation[]}
 * @description Compares the translations from the source and target using the uid(compiled from unique keys) environments and returns the translations that need to be created, updated and deleted
 */
function getTranslationAction(
  sourceTranslations: Translation[],
  targetTranslations: Translation[]
): {
  createdTranslations: Translation[];
  updatedTranslations: Translation[];
  deletedTranslations: Translation[];
} {
  const createdTranslations = sourceTranslations
    .filter((sourceTranslation) => {
      return !targetTranslations.find(
        ({ uid }) => sourceTranslation?.uid === uid
      );
    })
    .map((sourceTranslation) => {
      const { uid, id, ...translation } = sourceTranslation;
      return translation;
    });

  const updatedTranslationsCandidates = sourceTranslations
    .filter((sourceTranslation) => {
      return targetTranslations.find(
        ({ uid }) => sourceTranslation.uid === uid
      );
    })
    .map((sourceTranslation) => {
      return {
        sourceTranslation,
        targetTranslation: targetTranslations.find(
          ({ uid }) => sourceTranslation.uid === uid
        ),
      };
    });

  //use deep compare to check if the translations are the same
  const updatedTranslations = updatedTranslationsCandidates
    .filter(({ sourceTranslation, targetTranslation }) => {
      const {
        uid: sourceUID,
        id: sourceID,
        ...sourceTranslationWithoutID
      } = sourceTranslation;
      const {
        uid: targetUID,
        id: targetID,
        ...targetTranslationWithoutID
      } = targetTranslation || { uuid: null, id: null };
      return !DeepCompareJson(
        sourceTranslationWithoutID,
        targetTranslationWithoutID
      );
    })
    .map(({ sourceTranslation, targetTranslation }) => {
      const { uid, id: sourceId, ...translation } = sourceTranslation;
      const id = targetTranslation?.id;
      return { ...translation, id };
    });

  const deletedTranslations = targetTranslations.filter((targetTranslation) => {
    return !sourceTranslations.find(({ uid }) => {
      return uid === targetTranslation.uid;
    });
  });

  return { createdTranslations, updatedTranslations, deletedTranslations };
}

async function getTranslations(environment: Environment) {
  const privateTranslations = await CRUD({
    method: Method.GET,
    environment,
    path: "translations",
    params: {
      "filter[id][_nnull]": true,
      limit: -1,
    },
  });

  return privateTranslations?.data;
}

async function clearTranslations(environment: Environment, ids: string[]) {
  ids.forEach(async (id) => {
    await CRUD({
      method: Method.DELETE,
      environment,
      path: `translations${id ? `/${id}` : ""}`,
      params: {
        "filter[id][_nnull]": true,
        limit: -1,
      },
    });
  });
}

async function executeTranslationAction({
  method,
  environment,
  translations,
  id,
  successMessage,
  failMessage,
}: TranslationExecution) {
  const reqResponse = await CRUD({
    method,
    environment,
    path: `translations${id ? `/${id}` : ""}`,
    data: translations,
  });
  logger.info(successMessage(reqResponse.data));
  return reqResponse.data;
}

/**
 * Runs the translation migration
 */
export async function translationMigrator(
  source: Environment,
  target: Environment
) {
  logger.info("Migrating Translations");

  let targetTranslations = filterAndMutateTranslations(
    await getTranslations(target)
  );

  await clearTranslations(
    target,
    targetTranslations?.map((item) => item.id as string)
  );

  targetTranslations = [];

  const sourceTranslations = filterAndMutateTranslations(
    await getTranslations(source)
  );

  if (sourceTranslations.length > 0) {
    const { createdTranslations, updatedTranslations, deletedTranslations } =
      getTranslationAction(sourceTranslations, targetTranslations);

    logger.info(
      `Created: ${createdTranslations.length}, Updated: ${updatedTranslations.length}, Deleted: ${deletedTranslations.length}`
    );

    if (createdTranslations.length > 0) {
      await executeTranslationAction({
        method: Method.POST,
        environment: target,
        translations: createdTranslations,
        successMessage: (_data: any[]) =>
          `Created ${createdTranslations.length} Translation/s`,
        failMessage: (_response: any) => `Failed to create Translation`,
      });
    }

    if (updatedTranslations.length > 0) {
      await Promise.all(
        updatedTranslations.map(async (translations, index) => {
          const { id } = translations;
          return await executeTranslationAction({
            method: Method.PATCH,
            translations,
            environment: target,
            id,
            successMessage: (_data?: any) =>
              `Updated Translation ${index} with id:${id}`,
            failMessage: (_response: any) =>
              `Failed to Update Translation ${index} with id:${id}`,
          });
        })
      );
      logger.info(`Updated ${updatedTranslations.length} Translations`);
      return true;
    }

    if (deletedTranslations.length) {
      const ids = deletedTranslations.map(({ id }) => id) as string[];
      await executeTranslationAction({
        method: Method.DELETE,
        environment: target,
        id: ids.length === 1 ? ids[0] : undefined,
        translations: ids.length > 1 ? ids : undefined,
        successMessage: (_data: any[]) => `Deleted ${ids.length} Translation/s`,
        failMessage: (_response: any) =>
          `Failed to delete ${ids.length} Translation/s`,
      });
    }
  }
  logger.info("Migrating Translations Complete");
}
