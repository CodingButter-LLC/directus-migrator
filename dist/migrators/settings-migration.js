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
exports.settingMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Compare_1 = require("../utils/Compare");
const Logger_js_1 = __importDefault(require("../utils/Logger.js"));
function filterAndMutateSettings(settings) {
    return [settings].map((setting) => (Object.assign(Object.assign({}, setting), { uid: `${setting.id}` })));
}
/**
 *
 * @param sourceSettings
 * @param targetSettings
 * @returns { createdSettings: Setting[], updatedSettings: Setting[], deletedSettings: Setting[]}
 * @description Compares the settings from the source and target using the uid(compiled from unique keys) environments and returns the settings that need to be created, updated and deleted
 */
function getSettingAction(sourceSettings, targetSettings) {
    const createdSettings = sourceSettings
        .filter((sourceSetting) => {
        return !targetSettings.find(({ uid }) => (sourceSetting === null || sourceSetting === void 0 ? void 0 : sourceSetting.uid) === uid);
    })
        .map((sourceSetting) => {
        const { uid, id } = sourceSetting, setting = __rest(sourceSetting, ["uid", "id"]);
        return setting;
    });
    const updatedSettingsCandidates = sourceSettings
        .filter((sourceSetting) => {
        return targetSettings.find(({ uid }) => sourceSetting.uid === uid);
    })
        .map((sourceSetting) => {
        return {
            sourceSetting,
            targetSetting: targetSettings.find(({ uid }) => sourceSetting.uid === uid),
        };
    });
    //use deep compare to check if the settings are the same
    const updatedSettings = updatedSettingsCandidates
        .filter(({ sourceSetting, targetSetting }) => {
        const { uid: sourceUID, id: sourceID } = sourceSetting, sourceSettingWithoutID = __rest(sourceSetting, ["uid", "id"]);
        const _a = targetSetting || { uuid: null, id: null }, { uid: targetUID, id: targetID } = _a, targetSettingWithoutID = __rest(_a, ["uid", "id"]);
        return !(0, Compare_1.DeepCompareJson)(sourceSettingWithoutID, targetSettingWithoutID);
    })
        .map(({ sourceSetting, targetSetting }) => {
        const { uid, id: sourceId } = sourceSetting, setting = __rest(sourceSetting, ["uid", "id"]);
        const id = targetSetting === null || targetSetting === void 0 ? void 0 : targetSetting.id;
        return Object.assign(Object.assign({}, setting), { id });
    });
    const deletedSettings = targetSettings.filter((targetSetting) => {
        return !sourceSettings.find(({ uid }) => {
            return uid === targetSetting.uid;
        });
    });
    return { createdSettings, updatedSettings, deletedSettings };
}
function getSettings(environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const privateSettings = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
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
        return privateSettings === null || privateSettings === void 0 ? void 0 : privateSettings.data;
    });
}
function executeSettingAction({ method, environment, settings, id, successMessage, failMessage, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const reqResponse = yield (0, CRUD_1.default)({
            method,
            environment,
            path: `settings`,
            data: settings,
        });
        Logger_js_1.default.info(successMessage(reqResponse.data));
        return reqResponse.data;
    });
}
/**
 * Runs the setting migration
 */
function settingMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_js_1.default.info("Migrating Settings");
        const targetSettings = filterAndMutateSettings(yield getSettings(target));
        const sourceSettings = filterAndMutateSettings(yield getSettings(source));
        if (sourceSettings.length > 0) {
            const { createdSettings, updatedSettings, deletedSettings } = getSettingAction(sourceSettings, targetSettings);
            Logger_js_1.default.info(`Created: ${createdSettings.length}, Updated: ${updatedSettings.length}, Deleted: ${deletedSettings.length}`);
            if (createdSettings.length > 0) {
                yield executeSettingAction({
                    method: CRUD_1.Method.POST,
                    environment: target,
                    settings: createdSettings,
                    successMessage: (_data) => `Created ${createdSettings.length} Setting/s`,
                    failMessage: (_response) => `Failed to create Setting`,
                });
            }
            if (updatedSettings.length > 0) {
                yield Promise.all(updatedSettings.map((settings, index) => __awaiter(this, void 0, void 0, function* () {
                    const { id } = settings;
                    return yield executeSettingAction({
                        method: CRUD_1.Method.PATCH,
                        settings,
                        environment: target,
                        id,
                        successMessage: (_data) => `Updated Setting ${index} with id:${id}`,
                        failMessage: (_response) => `Failed to Update Setting ${index} with id:${id}`,
                    });
                })));
                Logger_js_1.default.info(`Updated ${updatedSettings.length} Settings`);
                return true;
            }
            if (deletedSettings.length) {
                const ids = deletedSettings.map(({ id }) => id);
                yield executeSettingAction({
                    method: CRUD_1.Method.DELETE,
                    environment: target,
                    id: ids.length === 1 ? ids[0] : undefined,
                    settings: ids.length > 1 ? ids : undefined,
                    successMessage: (_data) => `Deleted ${ids.length} Setting/s`,
                    failMessage: (_response) => `Failed to delete ${ids.length} Setting/s`,
                });
            }
        }
        Logger_js_1.default.info("Migrating Settings Complete");
    });
}
exports.settingMigrator = settingMigrator;
//# sourceMappingURL=settings-migration.js.map