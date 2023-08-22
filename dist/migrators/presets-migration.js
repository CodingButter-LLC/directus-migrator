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
exports.presetMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Compare_1 = require("../utils/Compare");
const Logger_js_1 = __importDefault(require("../utils/Logger.js"));
function filterAndMutatePresets(presets) {
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
function getPresetAction(sourcePresets, targetPresets) {
    const createdPresets = sourcePresets
        .filter((sourcePreset) => {
        return !targetPresets.find(({ uid }) => (sourcePreset === null || sourcePreset === void 0 ? void 0 : sourcePreset.uid) === uid);
    })
        .map((sourcePreset) => {
        const { uid, id } = sourcePreset, preset = __rest(sourcePreset, ["uid", "id"]);
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
        const { uid: sourceUID, id: sourceID } = sourcePreset, sourcePresetWithoutID = __rest(sourcePreset, ["uid", "id"]);
        const _a = targetPreset || { uuid: null, id: null }, { uid: targetUID, id: targetID } = _a, targetPresetWithoutID = __rest(_a, ["uid", "id"]);
        return !(0, Compare_1.DeepCompareJson)(sourcePresetWithoutID, targetPresetWithoutID);
    })
        .map(({ sourcePreset, targetPreset }) => {
        const { uid, id: sourceId } = sourcePreset, preset = __rest(sourcePreset, ["uid", "id"]);
        const id = targetPreset === null || targetPreset === void 0 ? void 0 : targetPreset.id;
        return Object.assign(Object.assign({}, preset), { id });
    });
    const deletedPresets = targetPresets.filter((targetPreset) => {
        return !sourcePresets.find(({ uid }) => {
            return uid === targetPreset.uid;
        });
    });
    return { createdPresets, updatedPresets, deletedPresets };
}
function getPresets(environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const privatePerms = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
            environment,
            path: "presets",
            params: {
                "filter[id][_nnull]": true,
                "filter[role][_nnull]": true,
                limit: -1,
            },
        });
        const publicPresets = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
            environment,
            path: "presets",
            params: {
                "filter[role][_null]": true,
                "filter[user][_null]": true,
                "filter[id][_nnull]": true,
                limit: -1,
            },
        });
        return [...privatePerms === null || privatePerms === void 0 ? void 0 : privatePerms.data, ...publicPresets === null || publicPresets === void 0 ? void 0 : publicPresets.data];
    });
}
function executePresetAction({ method, environment, presets, id, successMessage, failMessage, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const roleResponse = yield (0, CRUD_1.default)({
            method,
            environment,
            path: `presets${id ? `/${id}` : ""}`,
            data: presets,
        });
        Logger_js_1.default.info(successMessage(roleResponse.data));
        return roleResponse.data;
    });
}
/**
 * Runs the preset migration
 */
function presetMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_js_1.default.info("Migrating Presets");
        const targetPresets = filterAndMutatePresets(yield getPresets(target));
        const sourcePresets = filterAndMutatePresets(yield getPresets(source));
        if (sourcePresets.length > 0) {
            const { createdPresets, updatedPresets, deletedPresets } = getPresetAction(sourcePresets, targetPresets);
            Logger_js_1.default.info(`Created: ${createdPresets.length}, Updated: ${updatedPresets.length}, Deleted: ${deletedPresets.length}`);
            if (createdPresets.length > 0) {
                yield executePresetAction({
                    method: CRUD_1.Method.POST,
                    environment: target,
                    presets: createdPresets,
                    successMessage: (_data) => `Created ${createdPresets.length} Preset/s`,
                    failMessage: (_response) => `Failed to create Preset`,
                });
            }
            if (updatedPresets.length > 0) {
                yield Promise.all(updatedPresets.map((presets, index) => __awaiter(this, void 0, void 0, function* () {
                    const { id } = presets;
                    return yield executePresetAction({
                        method: CRUD_1.Method.PATCH,
                        presets,
                        environment: target,
                        id,
                        successMessage: (_data) => `Updated Preset ${index} with id:${id}`,
                        failMessage: (_response) => `Failed to Update Preset ${index} with id:${id}`,
                    });
                })));
                Logger_js_1.default.info(`Updated ${updatedPresets.length} Presets`);
                return true;
            }
            if (deletedPresets.length) {
                const ids = deletedPresets.map(({ id }) => id);
                yield executePresetAction({
                    method: CRUD_1.Method.DELETE,
                    environment: target,
                    id: ids.length === 1 ? ids[0] : undefined,
                    presets: ids.length > 1 ? ids : undefined,
                    successMessage: (_data) => `Deleted ${ids.length} Preset/s`,
                    failMessage: (_response) => `Failed to delete ${ids.length} Preset/s`,
                });
            }
        }
        Logger_js_1.default.info("Migrating Presets Complete");
    });
}
exports.presetMigrator = presetMigrator;
//# sourceMappingURL=presets-migration.js.map