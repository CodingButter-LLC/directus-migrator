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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleCategories = exports.getRoles = exports.removeAdmin = exports.migrate = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Logger_1 = __importDefault(require("../utils/Logger"));
function migrate(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_1.default.info("Migrating Roles");
        const { createdRoles, deletedRoles, adminIds } = yield getRoleCategories(source, target);
        if (createdRoles.length > 0) {
            Logger_1.default.info(`Created: ${createdRoles.length}, Deleted: ${deletedRoles.length}`);
            yield executeRoleAction({
                method: CRUD_1.Method.POST,
                roles: createdRoles,
                environment: target,
                successMessage: (roles) => `Created ${roles.length} Role/s`,
                failMessage: (message) => `Failed to create roles\n ${message}`,
            });
        }
        if (deletedRoles.length > 0) {
            yield Promise.all(deletedRoles.map((role) => {
                const { id } = role;
                executeRoleAction({
                    method: CRUD_1.Method.DELETE,
                    environment: target,
                    id,
                    successMessage: (roles) => `Deleted ${roles.length} Role/s`,
                    failMessage: (message) => `Failed to Delete roles\n ${message}`,
                });
            }));
        }
        Logger_1.default.info("Migrating Roles Complete");
        return adminIds;
    });
}
exports.migrate = migrate;
function removeAdmin(roles) {
    var _a;
    const adminId = ((_a = roles.find((role) => role.name === "Administrator")) === null || _a === void 0 ? void 0 : _a.id) || "";
    return [roles.filter((role) => role.id !== adminId), adminId];
}
exports.removeAdmin = removeAdmin;
function getRoles(environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const roleResponse = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
            environment,
            path: "roles",
        });
        if (!roleResponse)
            throw new Error(`Failed to retrieve Roles from ${environment.name}`);
        Logger_1.default.info(`Retrieved Roles from ${environment.name}`);
        return roleResponse === null || roleResponse === void 0 ? void 0 : roleResponse.data;
    });
}
exports.getRoles = getRoles;
function getRoleCategories(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const [sourceRoles, sourceAdminId] = removeAdmin(yield getRoles(source));
        const [targetRoles, targetAdminId] = removeAdmin(yield getRoles(target));
        const adminIds = { sourceAdminId, targetAdminId };
        const createdRoles = sourceRoles
            .filter((sourceRole) => !targetRoles.find((targetRole) => sourceRole.id === targetRole.id))
            .map((role) => {
            role.users = [];
            return role;
        });
        const deletedRoles = targetRoles.filter((targetRole) => !sourceRoles.find((sourceRole) => sourceRole.id === targetRole.id));
        return { createdRoles, deletedRoles, adminIds };
    });
}
exports.getRoleCategories = getRoleCategories;
function executeRoleAction({ method, environment, roles, id, successMessage, failMessage, }) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_1.default.info("", `Executing ${method} on ${environment.name}...`);
        const roleResponse = yield (0, CRUD_1.default)({
            method,
            environment,
            path: `roles${id ? `/${id}` : ""}`,
            data: roles,
        });
        if (!roleResponse)
            throw new Error(failMessage(roleResponse));
        Logger_1.default.info(successMessage(roleResponse.data));
        return roleResponse.data;
    });
}
