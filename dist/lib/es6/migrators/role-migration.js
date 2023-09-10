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
import CRUD, { Method } from "../utils/CRUD";
import logger from "../utils/Logger";
/**
 * Runs the Role Migration
 */
export function roleMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, createdRoles, deletedRoles, adminIds;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger.info("Migrating Roles");
                    return [4 /*yield*/, getRoleCategories(source, target)];
                case 1:
                    _a = _b.sent(), createdRoles = _a.createdRoles, deletedRoles = _a.deletedRoles, adminIds = _a.adminIds;
                    if (!(createdRoles.length > 0)) return [3 /*break*/, 3];
                    logger.info("Created: ".concat(createdRoles.length, ", Deleted: ").concat(deletedRoles.length));
                    return [4 /*yield*/, executeRoleAction({
                            method: Method.POST,
                            roles: createdRoles,
                            environment: target,
                            successMessage: function (roles) { return "Created ".concat(roles.length, " Role/s"); },
                            failMessage: function (message) { return "Failed to create roles\n ".concat(message); },
                        })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    if (!(deletedRoles.length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, Promise.all(deletedRoles.map(function (role) {
                            var id = role.id;
                            executeRoleAction({
                                method: Method.DELETE,
                                environment: target,
                                id: id,
                                successMessage: function (roles) { return "Deleted ".concat(roles.length, " Role/s"); },
                                failMessage: function (message) { return "Failed to Delete roles\n ".concat(message); },
                            });
                        }))];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    logger.info("Migrating Roles Complete");
                    return [2 /*return*/, adminIds];
            }
        });
    });
}
export function removeAdmin(roles) {
    var _a;
    var adminId = ((_a = roles.find(function (role) { return role.name === "Administrator"; })) === null || _a === void 0 ? void 0 : _a.id) || "";
    return [roles.filter(function (role) { return role.id !== adminId; }), adminId];
}
export function getRoles(environment) {
    return __awaiter(this, void 0, void 0, function () {
        var roleResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, CRUD({
                        method: Method.GET,
                        environment: environment,
                        path: "roles",
                    })];
                case 1:
                    roleResponse = _a.sent();
                    if (!roleResponse)
                        logger.error("Failed to retrieve Roles from ".concat(environment.name));
                    logger.info("Retrieved Roles from ".concat(environment.name));
                    return [2 /*return*/, roleResponse === null || roleResponse === void 0 ? void 0 : roleResponse.data];
            }
        });
    });
}
export function getRoleCategories(source, target) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, sourceRoles, sourceAdminId, _b, _c, targetRoles, targetAdminId, _d, adminIds, createdRoles, deletedRoles;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _b = removeAdmin;
                    return [4 /*yield*/, getRoles(source)];
                case 1:
                    _a = _b.apply(void 0, [_e.sent()]), sourceRoles = _a[0], sourceAdminId = _a[1];
                    _d = removeAdmin;
                    return [4 /*yield*/, getRoles(target)];
                case 2:
                    _c = _d.apply(void 0, [_e.sent()]), targetRoles = _c[0], targetAdminId = _c[1];
                    adminIds = { sourceAdminId: sourceAdminId, targetAdminId: targetAdminId };
                    createdRoles = sourceRoles
                        .filter(function (sourceRole) {
                        return !targetRoles.find(function (targetRole) { return sourceRole.id === targetRole.id; });
                    })
                        .map(function (role) {
                        role.users = [];
                        return role;
                    });
                    deletedRoles = targetRoles.filter(function (targetRole) {
                        return !sourceRoles.find(function (sourceRole) { return sourceRole.id === targetRole.id; });
                    });
                    return [2 /*return*/, { createdRoles: createdRoles, deletedRoles: deletedRoles, adminIds: adminIds }];
            }
        });
    });
}
function executeRoleAction(_a) {
    var method = _a.method, environment = _a.environment, roles = _a.roles, id = _a.id, successMessage = _a.successMessage, failMessage = _a.failMessage;
    return __awaiter(this, void 0, void 0, function () {
        var roleResponse;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger.info("", "Executing ".concat(method, " on ").concat(environment.name, "..."));
                    return [4 /*yield*/, CRUD({
                            method: method,
                            environment: environment,
                            path: "roles".concat(id ? "/".concat(id) : ""),
                            data: roles,
                        })];
                case 1:
                    roleResponse = _b.sent();
                    if (!roleResponse)
                        throw new Error(failMessage(roleResponse));
                    logger.info(successMessage(roleResponse.data));
                    return [2 /*return*/, roleResponse.data];
            }
        });
    });
}
