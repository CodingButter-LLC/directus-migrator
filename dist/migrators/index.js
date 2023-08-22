"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presetMigrator = exports.flowsMigrator = exports.permissionMigrator = exports.roleMigrator = exports.schemaMigrator = void 0;
var schema_migration_1 = require("./schema-migration");
Object.defineProperty(exports, "schemaMigrator", { enumerable: true, get: function () { return schema_migration_1.schemaMigrator; } });
var role_migration_1 = require("./role-migration");
Object.defineProperty(exports, "roleMigrator", { enumerable: true, get: function () { return role_migration_1.roleMigrator; } });
var permission_migration_1 = require("./permission-migration");
Object.defineProperty(exports, "permissionMigrator", { enumerable: true, get: function () { return permission_migration_1.permissionMigrator; } });
var flows_migration_1 = require("./flows-migration");
Object.defineProperty(exports, "flowsMigrator", { enumerable: true, get: function () { return flows_migration_1.flowsMigrator; } });
var presets_migration_1 = require("./presets-migration");
Object.defineProperty(exports, "presetMigrator", { enumerable: true, get: function () { return presets_migration_1.presetMigrator; } });
//# sourceMappingURL=index.js.map