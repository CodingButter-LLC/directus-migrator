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
exports.panelMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Compare_1 = require("../utils/Compare");
const Logger_js_1 = __importDefault(require("../utils/Logger.js"));
function filterAndMutatePanels(panels) {
    return panels;
}
/**
 *
 * @param sourcePanels
 * @param targetPanels
 * @returns { createdPanels: Panel[], updatedPanels: Panel[], deletedPanels: Panel[]}
 * @description Compares the panels from the source and target using the uid(compiled from unique keys) environments and returns the panels that need to be created, updated and deleted
 */
function getPanelAction(sourcePanels, targetPanels) {
    const createdPanels = sourcePanels
        .filter((sourcePanel) => {
        return !targetPanels.find(({ uid }) => (sourcePanel === null || sourcePanel === void 0 ? void 0 : sourcePanel.uid) === uid);
    })
        .map((sourcePanel) => {
        const { uid, id } = sourcePanel, panel = __rest(sourcePanel, ["uid", "id"]);
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
        const { uid: sourceUID, id: sourceID } = sourcePanel, sourcePanelWithoutID = __rest(sourcePanel, ["uid", "id"]);
        const _a = targetPanel || { uuid: null, id: null }, { uid: targetUID, id: targetID } = _a, targetPanelWithoutID = __rest(_a, ["uid", "id"]);
        return !(0, Compare_1.DeepCompareJson)(sourcePanelWithoutID, targetPanelWithoutID);
    })
        .map(({ sourcePanel, targetPanel }) => {
        const { uid, id: sourceId } = sourcePanel, panel = __rest(sourcePanel, ["uid", "id"]);
        const id = targetPanel === null || targetPanel === void 0 ? void 0 : targetPanel.id;
        return Object.assign(Object.assign({}, panel), { id });
    });
    const deletedPanels = targetPanels.filter((targetPanel) => {
        return !sourcePanels.find(({ uid }) => {
            return uid === targetPanel.uid;
        });
    });
    return { createdPanels, updatedPanels, deletedPanels };
}
function getPanels(environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const privateTransaltions = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
            environment,
            path: "panels",
            params: {
                "filter[id][_nnull]": true,
                limit: -1,
            },
        });
        return privateTransaltions === null || privateTransaltions === void 0 ? void 0 : privateTransaltions.data;
    });
}
function clearPanels(environment, ids) {
    return __awaiter(this, void 0, void 0, function* () {
        ids.forEach((id) => __awaiter(this, void 0, void 0, function* () {
            yield (0, CRUD_1.default)({
                method: CRUD_1.Method.DELETE,
                environment,
                path: `panels${id ? `/${id}` : ""}`,
                params: {
                    "filter[id][_nnull]": true,
                    limit: -1,
                },
            });
        }));
    });
}
function executePanelAction({ method, environment, panels, id, successMessage, failMessage, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const reqResponse = yield (0, CRUD_1.default)({
            method,
            environment,
            path: `panels${id ? `/${id}` : ""}`,
            data: panels,
        });
        Logger_js_1.default.info(successMessage(reqResponse.data));
        return reqResponse.data;
    });
}
/**
 * Runs the panel migration
 */
function panelMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_js_1.default.info("Migrating Panels");
        let targetPanels = filterAndMutatePanels(yield getPanels(target));
        yield clearPanels(target, targetPanels === null || targetPanels === void 0 ? void 0 : targetPanels.map((item) => item.id));
        targetPanels = [];
        const sourcePanels = filterAndMutatePanels(yield getPanels(source));
        if (sourcePanels.length > 0) {
            const { createdPanels, updatedPanels, deletedPanels } = getPanelAction(sourcePanels, targetPanels);
            Logger_js_1.default.info(`Created: ${createdPanels.length}, Updated: ${updatedPanels.length}, Deleted: ${deletedPanels.length}`);
            if (createdPanels.length > 0) {
                yield executePanelAction({
                    method: CRUD_1.Method.POST,
                    environment: target,
                    panels: createdPanels,
                    successMessage: (_data) => `Created ${createdPanels.length} Panel/s`,
                    failMessage: (_response) => `Failed to create Panel`,
                });
            }
            if (updatedPanels.length > 0) {
                yield Promise.all(updatedPanels.map((panels, index) => __awaiter(this, void 0, void 0, function* () {
                    const { id } = panels;
                    return yield executePanelAction({
                        method: CRUD_1.Method.PATCH,
                        panels,
                        environment: target,
                        id,
                        successMessage: (_data) => `Updated Panel ${index} with id:${id}`,
                        failMessage: (_response) => `Failed to Update Panel ${index} with id:${id}`,
                    });
                })));
                Logger_js_1.default.info(`Updated ${updatedPanels.length} Panels`);
                return true;
            }
            if (deletedPanels.length) {
                const ids = deletedPanels.map(({ id }) => id);
                yield executePanelAction({
                    method: CRUD_1.Method.DELETE,
                    environment: target,
                    id: ids.length === 1 ? ids[0] : undefined,
                    panels: ids.length > 1 ? ids : undefined,
                    successMessage: (_data) => `Deleted ${ids.length} Panel/s`,
                    failMessage: (_response) => `Failed to delete ${ids.length} Panel/s`,
                });
            }
        }
        Logger_js_1.default.info("Migrating Panels Complete");
    });
}
exports.panelMigrator = panelMigrator;
//# sourceMappingURL=panels-migration%20copy.js.map