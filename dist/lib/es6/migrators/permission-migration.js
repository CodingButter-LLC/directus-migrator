var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import CRUD, { Method } from "../utils/CRUD";
import { DeepCompareJson } from "../utils/Compare";
import logger from "../utils/Logger.js";
function filterAndMutatePermissions(permissions, adminId) {
    var filteredPermissions = permissions.filter(function (_a) {
        var role = _a.role, id = _a.id;
        return role != adminId && id != null;
    });
    filteredPermissions.forEach(function (permission) {
        permission.uid = "".concat(permission.role).concat(permission.collection).concat(permission.action);
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
    var createdPermissions = sourcePermissions
        .filter(function (sourcePermission) {
        return !targetPermissions.find(function (_a) {
            var uid = _a.uid;
            return (sourcePermission === null || sourcePermission === void 0 ? void 0 : sourcePermission.uid) === uid;
        });
    })
        .map(function (sourcePermission) {
        var uid = sourcePermission.uid, id = sourcePermission.id, permission = __rest(sourcePermission, ["uid", "id"]);
        return permission;
    });
    var updatedPermissionsCandidates = sourcePermissions
        .filter(function (sourcePermission) {
        return targetPermissions.find(function (_a) {
            var uid = _a.uid;
            return sourcePermission.uid === uid;
        });
    })
        .map(function (sourcePermission) {
        return {
            sourcePermission: sourcePermission,
            targetPermission: targetPermissions.find(function (_a) {
                var uid = _a.uid;
                return sourcePermission.uid === uid;
            }),
        };
    });
    //use deep compare to check if the permissions are the same
    var updatedPermissions = updatedPermissionsCandidates
        .filter(function (_a) {
        var sourcePermission = _a.sourcePermission, targetPermission = _a.targetPermission;
        var sourceUID = sourcePermission.uid, sourceID = sourcePermission.id, sourcePermissionWithoutID = __rest(sourcePermission, ["uid", "id"]);
        var _b = targetPermission || { uuid: null, id: null }, targetUID = _b.uid, targetID = _b.id, targetPermissionWithoutID = __rest(_b, ["uid", "id"]);
        return !DeepCompareJson(sourcePermissionWithoutID, targetPermissionWithoutID);
    })
        .map(function (_a) {
        var sourcePermission = _a.sourcePermission, targetPermission = _a.targetPermission;
        var uid = sourcePermission.uid, sourceId = sourcePermission.id, permission = __rest(sourcePermission, ["uid", "id"]);
        var id = targetPermission === null || targetPermission === void 0 ? void 0 : targetPermission.id;
        return __assign(__assign({}, permission), { id: id });
    });
    var deletedPermissions = targetPermissions.filter(function (targetPermission) {
        return !sourcePermissions.find(function (_a) {
            var uid = _a.uid;
            return uid === targetPermission.uid;
        });
    });
    return { createdPermissions: createdPermissions, updatedPermissions: updatedPermissions, deletedPermissions: deletedPermissions };
}
function getPermissions(environment) {
    return __awaiter(this, void 0, void 0, function () {
        var privatePerms, publicPerms;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, CRUD({
                        method: Method.GET,
                        environment: environment,
                        path: "permissions",
                        params: {
                            "filter[id][_nnull]": true,
                            "filter[role][_nnull]": true,
                            limit: -1,
                        },
                    })];
                case 1:
                    privatePerms = _a.sent();
                    return [4 /*yield*/, CRUD({
                            method: Method.GET,
                            environment: environment,
                            path: "permissions",
                            params: {
                                "filter[role][_null]": true,
                                "filter[id][_nnull]": true,
                                limit: -1,
                            },
                        })];
                case 2:
                    publicPerms = _a.sent();
                    return [2 /*return*/, __spreadArray(__spreadArray([], privatePerms === null || privatePerms === void 0 ? void 0 : privatePerms.data, true), publicPerms === null || publicPerms === void 0 ? void 0 : publicPerms.data, true)];
            }
        });
    });
}
function executePermissionAction(_a) {
    var method = _a.method, environment = _a.environment, permissions = _a.permissions, id = _a.id, successMessage = _a.successMessage, failMessage = _a.failMessage;
    return __awaiter(this, void 0, void 0, function () {
        var roleResponse;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, CRUD({
                        method: method,
                        environment: environment,
                        path: "permissions".concat(id ? "/".concat(id) : ""),
                        data: permissions,
                    })];
                case 1:
                    roleResponse = _b.sent();
                    logger.info(successMessage(roleResponse.data));
                    return [2 /*return*/, roleResponse.data];
            }
        });
    });
}
/**
 * Runs the permission migration
 */
export function permissionMigrator(source, target, adminIds) {
    return __awaiter(this, void 0, void 0, function () {
        var targetPermissions, _a, sourcePermissions, _b, _c, createdPermissions_1, updatedPermissions, deletedPermissions, ids_1;
        var _this = this;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    logger.info("Migrating Permissions");
                    _a = filterAndMutatePermissions;
                    return [4 /*yield*/, getPermissions(target)];
                case 1:
                    targetPermissions = _a.apply(void 0, [_d.sent(), adminIds.targetAdminId]);
                    _b = filterAndMutatePermissions;
                    return [4 /*yield*/, getPermissions(source)];
                case 2:
                    sourcePermissions = _b.apply(void 0, [_d.sent(), adminIds.sourceAdminId]);
                    if (!(sourcePermissions.length > 0)) return [3 /*break*/, 8];
                    _c = getPermissionAction(sourcePermissions, targetPermissions), createdPermissions_1 = _c.createdPermissions, updatedPermissions = _c.updatedPermissions, deletedPermissions = _c.deletedPermissions;
                    logger.info("Created: ".concat(createdPermissions_1.length, ", Updated: ").concat(updatedPermissions.length, ", Deleted: ").concat(deletedPermissions.length));
                    if (!(createdPermissions_1.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, executePermissionAction({
                            method: Method.POST,
                            environment: target,
                            permissions: createdPermissions_1,
                            successMessage: function (_data) {
                                return "Created ".concat(createdPermissions_1.length, " Permission/s");
                            },
                            failMessage: function (_response) { return "Failed to create Permission"; },
                        })];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    if (!(updatedPermissions.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, Promise.all(updatedPermissions.map(function (permissions, index) { return __awaiter(_this, void 0, void 0, function () {
                            var id;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        id = permissions.id;
                                        return [4 /*yield*/, executePermissionAction({
                                                method: Method.PATCH,
                                                permissions: permissions,
                                                environment: target,
                                                id: id,
                                                successMessage: function (_data) {
                                                    return "Updated Permission ".concat(index, " with id:").concat(id);
                                                },
                                                failMessage: function (_response) {
                                                    return "Failed to Update Permission ".concat(index, " with id:").concat(id);
                                                },
                                            })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); }))];
                case 5:
                    _d.sent();
                    logger.info("Updated ".concat(updatedPermissions.length, " Permissions"));
                    return [2 /*return*/, true];
                case 6:
                    if (!deletedPermissions.length) return [3 /*break*/, 8];
                    ids_1 = deletedPermissions.map(function (_a) {
                        var id = _a.id;
                        return id;
                    });
                    return [4 /*yield*/, executePermissionAction({
                            method: Method.DELETE,
                            environment: target,
                            id: ids_1.length === 1 ? ids_1[0] : undefined,
                            permissions: ids_1.length > 1 ? ids_1 : undefined,
                            successMessage: function (_data) { return "Deleted ".concat(ids_1.length, " Permission/s"); },
                            failMessage: function (_response) {
                                return "Failed to delete ".concat(ids_1.length, " Permission/s");
                            },
                        })];
                case 7:
                    _d.sent();
                    _d.label = 8;
                case 8:
                    logger.info("Migrating Permissions Complete");
                    return [2 /*return*/];
            }
        });
    });
}
