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
exports.dashboardMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Compare_1 = require("../utils/Compare");
const Logger_js_1 = __importDefault(require("../utils/Logger.js"));
function filterAndMutateDashboards(dashboards) {
    return dashboards.map((dashboard) => (Object.assign(Object.assign({}, dashboard), { uid: `${dashboard.id}` })));
}
/**
 *
 * @param sourceDashboards
 * @param targetDashboards
 * @returns { createdDashboards: Dashboard[], updatedDashboards: Dashboard[], deletedDashboards: Dashboard[]}
 * @description Compares the dashboards from the source and target using the uid(compiled from unique keys) environments and returns the dashboards that need to be created, updated and deleted
 */
function getDashboardAction(sourceDashboards, targetDashboards) {
    const createdDashboards = sourceDashboards
        .filter((sourceDashboard) => {
        return !targetDashboards.find(({ uid }) => (sourceDashboard === null || sourceDashboard === void 0 ? void 0 : sourceDashboard.uid) === uid);
    })
        .map((sourceDashboard) => {
        const { uid, id } = sourceDashboard, dashboard = __rest(sourceDashboard, ["uid", "id"]);
        return dashboard;
    });
    const updatedDashboardsCandidates = sourceDashboards
        .filter((sourceDashboard) => {
        return targetDashboards.find(({ uid }) => sourceDashboard.uid === uid);
    })
        .map((sourceDashboard) => {
        return {
            sourceDashboard,
            targetDashboard: targetDashboards.find(({ uid }) => sourceDashboard.uid === uid),
        };
    });
    //use deep compare to check if the dashboards are the same
    const updatedDashboards = updatedDashboardsCandidates
        .filter(({ sourceDashboard, targetDashboard }) => {
        const { uid: sourceUID, id: sourceID } = sourceDashboard, sourceDashboardWithoutID = __rest(sourceDashboard, ["uid", "id"]);
        const _a = targetDashboard || { uuid: null, id: null }, { uid: targetUID, id: targetID } = _a, targetDashboardWithoutID = __rest(_a, ["uid", "id"]);
        return !(0, Compare_1.DeepCompareJson)(sourceDashboardWithoutID, targetDashboardWithoutID);
    })
        .map(({ sourceDashboard, targetDashboard }) => {
        const { uid, id: sourceId } = sourceDashboard, dashboard = __rest(sourceDashboard, ["uid", "id"]);
        const id = targetDashboard === null || targetDashboard === void 0 ? void 0 : targetDashboard.id;
        return Object.assign(Object.assign({}, dashboard), { id });
    });
    const deletedDashboards = targetDashboards.filter((targetDashboard) => {
        return !sourceDashboards.find(({ uid }) => {
            return uid === targetDashboard.uid;
        });
    });
    return { createdDashboards, updatedDashboards, deletedDashboards };
}
function getDashboards(environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const privateDashboards = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
            environment,
            path: "dashboards",
            params: {
                "filter[id][_nnull]": true,
                limit: -1,
            },
        });
        return privateDashboards === null || privateDashboards === void 0 ? void 0 : privateDashboards.data;
    });
}
function clearDashboards(environment, ids) {
    return __awaiter(this, void 0, void 0, function* () {
        ids.forEach((id) => __awaiter(this, void 0, void 0, function* () {
            yield (0, CRUD_1.default)({
                method: CRUD_1.Method.DELETE,
                environment,
                path: `dashboards${id ? `/${id}` : ""}`,
                params: {
                    "filter[id][_nnull]": true,
                    limit: -1,
                },
            });
        }));
    });
}
function executeDashboardAction({ method, environment, dashboards, id, successMessage, failMessage, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const reqResponse = yield (0, CRUD_1.default)({
            method,
            environment,
            path: `dashboards${id ? `/${id}` : ""}`,
            data: dashboards,
        });
        Logger_js_1.default.info(successMessage(reqResponse.data));
        return reqResponse.data;
    });
}
/**
 * Runs the dashboard migration
 */
function dashboardMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_js_1.default.info("Migrating Dashboards");
        let targetDashboards = filterAndMutateDashboards(yield getDashboards(target));
        yield clearDashboards(target, targetDashboards === null || targetDashboards === void 0 ? void 0 : targetDashboards.map((item) => item.id));
        targetDashboards = [];
        const sourceDashboards = filterAndMutateDashboards(yield getDashboards(source));
        if (sourceDashboards.length > 0) {
            const { createdDashboards, updatedDashboards, deletedDashboards } = getDashboardAction(sourceDashboards, targetDashboards);
            Logger_js_1.default.info(`Created: ${createdDashboards.length}, Updated: ${updatedDashboards.length}, Deleted: ${deletedDashboards.length}`);
            if (createdDashboards.length > 0) {
                yield executeDashboardAction({
                    method: CRUD_1.Method.POST,
                    environment: target,
                    dashboards: createdDashboards,
                    successMessage: (_data) => `Created ${createdDashboards.length} Dashboard/s`,
                    failMessage: (_response) => `Failed to create Dashboard`,
                });
            }
            if (updatedDashboards.length > 0) {
                yield Promise.all(updatedDashboards.map((dashboards, index) => __awaiter(this, void 0, void 0, function* () {
                    const { id } = dashboards;
                    return yield executeDashboardAction({
                        method: CRUD_1.Method.PATCH,
                        dashboards,
                        environment: target,
                        id,
                        successMessage: (_data) => `Updated Dashboard ${index} with id:${id}`,
                        failMessage: (_response) => `Failed to Update Dashboard ${index} with id:${id}`,
                    });
                })));
                Logger_js_1.default.info(`Updated ${updatedDashboards.length} Dashboards`);
                return true;
            }
            if (deletedDashboards.length) {
                const ids = deletedDashboards.map(({ id }) => id);
                yield executeDashboardAction({
                    method: CRUD_1.Method.DELETE,
                    environment: target,
                    id: ids.length === 1 ? ids[0] : undefined,
                    dashboards: ids.length > 1 ? ids : undefined,
                    successMessage: (_data) => `Deleted ${ids.length} Dashboard/s`,
                    failMessage: (_response) => `Failed to delete ${ids.length} Dashboard/s`,
                });
            }
        }
        Logger_js_1.default.info("Migrating Dashboards Complete");
    });
}
exports.dashboardMigrator = dashboardMigrator;
//# sourceMappingURL=dashboards-migration.js.map