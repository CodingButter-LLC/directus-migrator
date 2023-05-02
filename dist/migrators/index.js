"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionMigrator = exports.RoleMigrator = exports.SchemaMigrator = void 0;
var schema_migration_1 = require("./schema-migration");
Object.defineProperty(exports, "SchemaMigrator", { enumerable: true, get: function () { return schema_migration_1.migrate; } });
var role_migration_1 = require("./role-migration");
Object.defineProperty(exports, "RoleMigrator", { enumerable: true, get: function () { return role_migration_1.migrate; } });
var permission_migration_1 = require("./permission-migration");
Object.defineProperty(exports, "PermissionMigrator", { enumerable: true, get: function () { return permission_migration_1.migrate; } });
