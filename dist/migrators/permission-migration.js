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
exports.permissionMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Compare_1 = require("../utils/Compare");
const Logger_js_1 = __importDefault(require("../utils/Logger.js"));
function filterAndMutatePermissions(permissions, adminId) {
    const filteredPermissions = permissions.filter(({ role, id }) => role != adminId && id != null);
    filteredPermissions.forEach((permission) => {
        permission.uid = `${permission.role}${permission.collection}${permission.action}`;
    });
    return filteredPermissions;
}
/**
 *
 * @param sourcePermissions
 * @param targetPermissions
 * @returns { createdPermissions: Permission[], updatedPermissions: Permission[], deletedPermissions: Permission[]}
 * @description Compares the permissions from the source and target using the uid(compiled from unique keys) environments and returns the permissions that need to be created, updated and deleted
 */
function getPermissionAction(sourcePermissions, targetPermissions) {
    const createdPermissions = sourcePermissions
        .filter((sourcePermission) => {
        return !targetPermissions.find(({ uid }) => (sourcePermission === null || sourcePermission === void 0 ? void 0 : sourcePermission.uid) === uid);
    })
        .map((sourcePermission) => {
        const { uid, id } = sourcePermission, permission = __rest(sourcePermission, ["uid", "id"]);
        return permission;
    });
    const updatedPermissionsCandidates = sourcePermissions
        .filter((sourcePermission) => {
        return targetPermissions.find(({ uid }) => sourcePermission.uid === uid);
    })
        .map((sourcePermission) => {
        return {
            sourcePermission,
            targetPermission: targetPermissions.find(({ uid }) => sourcePermission.uid === uid),
        };
    });
    //use deep compare to check if the permissions are the same
    const updatedPermissions = updatedPermissionsCandidates
        .filter(({ sourcePermission, targetPermission }) => {
        const { uid: sourceUID, id: sourceID } = sourcePermission, sourcePermissionWithoutID = __rest(sourcePermission, ["uid", "id"]);
        const _a = targetPermission || { uuid: null, id: null }, { uid: targetUID, id: targetID } = _a, targetPermissionWithoutID = __rest(_a, ["uid", "id"]);
        return !(0, Compare_1.DeepCompareJson)(sourcePermissionWithoutID, targetPermissionWithoutID);
    })
        .map(({ sourcePermission, targetPermission }) => {
        const { uid, id: sourceId } = sourcePermission, permission = __rest(sourcePermission, ["uid", "id"]);
        const id = targetPermission === null || targetPermission === void 0 ? void 0 : targetPermission.id;
        return Object.assign(Object.assign({}, permission), { id });
    });
    const deletedPermissions = targetPermissions.filter((targetPermission) => {
        return !sourcePermissions.find(({ uid }) => {
            return uid === targetPermission.uid;
        });
    });
    return { createdPermissions, updatedPermissions, deletedPermissions };
}
function getPermissions(environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const privatePerms = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
            environment,
            path: "permissions",
            params: {
                "filter[id][_nnull]": true,
                "filter[role][_nnull]": true,
                limit: -1,
            },
        });
        const publicPerms = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
            environment,
            path: "permissions",
            params: {
                "filter[role][_null]": true,
                "filter[id][_nnull]": true,
                limit: -1,
            },
        });
        return [...privatePerms === null || privatePerms === void 0 ? void 0 : privatePerms.data, ...publicPerms === null || publicPerms === void 0 ? void 0 : publicPerms.data];
    });
}
function executePermissionAction({ method, environment, permissions, id, successMessage, failMessage, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const roleResponse = yield (0, CRUD_1.default)({
            method,
            environment,
            path: `permissions${id ? `/${id}` : ""}`,
            data: permissions,
        });
        Logger_js_1.default.info(successMessage(roleResponse.data));
        return roleResponse.data;
    });
}
/**
 * Runs the permission migration
 */
function permissionMigrator(source, target, adminIds) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_js_1.default.info("Migrating Permissions");
        const targetPermissions = filterAndMutatePermissions(yield getPermissions(target), adminIds.targetAdminId);
        const sourcePermissions = filterAndMutatePermissions(yield getPermissions(source), adminIds.sourceAdminId);
        if (sourcePermissions.length > 0) {
            const { createdPermissions, updatedPermissions, deletedPermissions } = getPermissionAction(sourcePermissions, targetPermissions);
            Logger_js_1.default.info(`Created: ${createdPermissions.length}, Updated: ${updatedPermissions.length}, Deleted: ${deletedPermissions.length}`);
            if (createdPermissions.length > 0) {
                yield executePermissionAction({
                    method: CRUD_1.Method.POST,
                    environment: target,
                    permissions: createdPermissions,
                    successMessage: (_data) => `Created ${createdPermissions.length} Permission/s`,
                    failMessage: (_response) => `Failed to create Permission`,
                });
            }
            if (updatedPermissions.length > 0) {
                yield Promise.all(updatedPermissions.map((permissions, index) => __awaiter(this, void 0, void 0, function* () {
                    const { id } = permissions;
                    return yield executePermissionAction({
                        method: CRUD_1.Method.PATCH,
                        permissions,
                        environment: target,
                        id,
                        successMessage: (_data) => `Updated Permission ${index} with id:${id}`,
                        failMessage: (_response) => `Failed to Update Permission ${index} with id:${id}`,
                    });
                })));
                Logger_js_1.default.info(`Updated ${updatedPermissions.length} Permissions`);
                return true;
            }
            if (deletedPermissions.length) {
                const ids = deletedPermissions.map(({ id }) => id);
                yield executePermissionAction({
                    method: CRUD_1.Method.DELETE,
                    environment: target,
                    id: ids.length === 1 ? ids[0] : undefined,
                    permissions: ids.length > 1 ? ids : undefined,
                    successMessage: (_data) => `Deleted ${ids.length} Permission/s`,
                    failMessage: (_response) => `Failed to delete ${ids.length} Permission/s`,
                });
            }
        }
        Logger_js_1.default.info("Migrating Permissions Complete");
    });
}
exports.permissionMigrator = permissionMigrator;
//# sourceMappingURL=permission-migration.js.map