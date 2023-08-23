"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Compare_1 = require("../utils/Compare");
const Logger_js_1 = __importDefault(require("../utils/Logger.js"));
function filterAndMutateTranslations(translations) {
    return translations.map((translation) => (Object.assign(Object.assign({}, translation), { uid: `${translation.id}` })));
}
/**
 *
 * @param sourceTranslations
 * @param targetTranslations
 * @returns { createdTranslations: Translation[], updatedTranslations: Translation[], deletedTranslations: Translation[]}
 * @description Compares the translations from the source and target using the uid(compiled from unique keys) environments and returns the translations that need to be created, updated and deleted
 */
function getTranslationAction(sourceTranslations, targetTranslations) {
    const createdTranslations = sourceTranslations
        .filter((sourceTranslation) => {
        return !targetTranslations.find(({ uid }) => (sourceTranslation === null || sourceTranslation === void 0 ? void 0 : sourceTranslation.uid) === uid);
    })
        .map((sourceTranslation) => {
        const { uid, id } = sourceTranslation, translation = __rest(sourceTranslation, ["uid", "id"]);
        return translation;
    });
    const updatedTranslationsCandidates = sourceTranslations
        .filter((sourceTranslation) => {
        return targetTranslations.find(({ uid }) => sourceTranslation.uid === uid);
    })
        .map((sourceTranslation) => {
        return {
            sourceTranslation,
            targetTranslation: targetTranslations.find(({ uid }) => sourceTranslation.uid === uid),
        };
    });
    //use deep compare to check if the translations are the same
    const updatedTranslations = updatedTranslationsCandidates
        .filter(({ sourceTranslation, targetTranslation }) => {
        const { uid: sourceUID, id: sourceID } = sourceTranslation, sourceTranslationWithoutID = __rest(sourceTranslation, ["uid", "id"]);
        const _a = targetTranslation || { uuid: null, id: null }, { uid: targetUID, id: targetID } = _a, targetTranslationWithoutID = __rest(_a, ["uid", "id"]);
        return !(0, Compare_1.DeepCompareJson)(sourceTranslationWithoutID, targetTranslationWithoutID);
    })
        .map(({ sourceTranslation, targetTranslation }) => {
        const { uid, id: sourceId } = sourceTranslation, translation = __rest(sourceTranslation, ["uid", "id"]);
        const id = targetTranslation === null || targetTranslation === void 0 ? void 0 : targetTranslation.id;
        return Object.assign(Object.assign({}, translation), { id });
    });
    const deletedTranslations = targetTranslations.filter((targetTranslation) => {
        return !sourceTranslations.find(({ uid }) => {
            return uid === targetTranslation.uid;
        });
    });
    return { createdTranslations, updatedTranslations, deletedTranslations };
}
function getTranslations(environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const privateTranslations = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
            environment,
            path: "translations",
            params: {
                "filter[id][_nnull]": true,
                limit: -1,
            },
        });
        return privateTranslations === null || privateTranslations === void 0 ? void 0 : privateTranslations.data;
    });
}
function clearTranslations(environment, ids) {
    return __awaiter(this, void 0, void 0, function* () {
        ids.forEach((id) => __awaiter(this, void 0, void 0, function* () {
            yield (0, CRUD_1.default)({
                method: CRUD_1.Method.DELETE,
                environment,
                path: `translations${id ? `/${id}` : ""}`,
                params: {
                    "filter[id][_nnull]": true,
                    limit: -1,
                },
            });
        }));
    });
}
function executeTranslationAction({ method, environment, translations, id, successMessage, failMessage, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const reqResponse = yield (0, CRUD_1.default)({
            method,
            environment,
            path: `translations${id ? `/${id}` : ""}`,
            data: translations,
        });
        Logger_js_1.default.info(successMessage(reqResponse.data));
        return reqResponse.data;
    });
}
/**
 * Runs the translation migration
 */
function translationMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_js_1.default.info("Migrating Translations");
        let targetTranslations = filterAndMutateTranslations(yield getTranslations(target));
        yield clearTranslations(target, targetTranslations === null || targetTranslations === void 0 ? void 0 : targetTranslations.map((item) => item.id));
        targetTranslations = [];
        const sourceTranslations = filterAndMutateTranslations(yield getTranslations(source));
        if (sourceTranslations.length > 0) {
            const { createdTranslations, updatedTranslations, deletedTranslations } = getTranslationAction(sourceTranslations, targetTranslations);
            Logger_js_1.default.info(`Created: ${createdTranslations.length}, Updated: ${updatedTranslations.length}, Deleted: ${deletedTranslations.length}`);
            if (createdTranslations.length > 0) {
                yield executeTranslationAction({
                    method: CRUD_1.Method.POST,
                    environment: target,
                    translations: createdTranslations,
                    successMessage: (_data) => `Created ${createdTranslations.length} Translation/s`,
                    failMessage: (_response) => `Failed to create Translation`,
                });
            }
            if (updatedTranslations.length > 0) {
                yield Promise.all(updatedTranslations.map((translations, index) => __awaiter(this, void 0, void 0, function* () {
                    const { id } = translations;
                    return yield executeTranslationAction({
                        method: CRUD_1.Method.PATCH,
                        translations,
                        environment: target,
                        id,
                        successMessage: (_data) => `Updated Translation ${index} with id:${id}`,
                        failMessage: (_response) => `Failed to Update Translation ${index} with id:${id}`,
                    });
                })));
                Logger_js_1.default.info(`Updated ${updatedTranslations.length} Translations`);
                return true;
            }
            if (deletedTranslations.length) {
                const ids = deletedTranslations.map(({ id }) => id);
                yield executeTranslationAction({
                    method: CRUD_1.Method.DELETE,
                    environment: target,
                    id: ids.length === 1 ? ids[0] : undefined,
                    translations: ids.length > 1 ? ids : undefined,
                    successMessage: (_data) => `Deleted ${ids.length} Translation/s`,
                    failMessage: (_response) => `Failed to delete ${ids.length} Translation/s`,
                });
            }
        }
        Logger_js_1.default.info("Migrating Translations Complete");
    });
}
exports.translationMigrator = translationMigrator;
//# sourceMappingURL=translations-migration.js.map