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
exports.directusMigrator = void 0;
const migrators_1 = require("./migrators");
const Logger_1 = __importDefault(require("./utils/Logger"));
/**
 *  Runs the Directus Migration
 */
function directusMigrator(source, target, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const { force = false, roles, permissions, flows, schema } = args;
        if (!source || !target) {
            Logger_1.default.error("Source and Target Environments are required");
            return;
        }
        if (roles || permissions || schema || flows) {
            if (schema) {
                return yield (0, migrators_1.schemaMigrator)(source, target, force);
            }
            if (flows) {
            }
            if (permissions) {
                const adminIds = yield (0, migrators_1.roleMigrator)(source, target);
                yield (0, migrators_1.permissionMigrator)(source, target, adminIds);
            }
        }
        else {
            yield (0, migrators_1.schemaMigrator)(source, target, force);
            const adminIds = yield (0, migrators_1.roleMigrator)(source, target);
            yield (0, migrators_1.permissionMigrator)(source, target, adminIds);
            yield (0, migrators_1.flowsMigrator)(source, target);
        }
        Logger_1.default.info("Migration Completed!");
    });
}
exports.directusMigrator = directusMigrator;
//# sourceMappingURL=index.js.map