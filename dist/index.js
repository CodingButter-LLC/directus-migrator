"use strict";
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
exports.DirectusMigrator = void 0;
const migrators_1 = require("./migrators");
const Logger_1 = __importDefault(require("./utils/Logger"));
function DirectusMigrator(source, target, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const { force = false, roles, permissions, schema } = args;
        if (!source || !target) {
            Logger_1.default.error("Source and Target Environments are required");
            return;
        }
        if (roles || permissions || schema) {
            if (schema) {
                return yield (0, migrators_1.SchemaMigrator)(source, target, force);
            }
            const adminIds = yield (0, migrators_1.RoleMigrator)(source, target);
            if (permissions) {
                yield (0, migrators_1.PermissionMigrator)(source, target, adminIds);
            }
        }
        else {
            yield (0, migrators_1.SchemaMigrator)(source, target, force);
            const adminIds = yield (0, migrators_1.RoleMigrator)(source, target);
            yield (0, migrators_1.PermissionMigrator)(source, target, adminIds);
        }
        Logger_1.default.info("Migration Completed!");
    });
}
exports.DirectusMigrator = DirectusMigrator;
