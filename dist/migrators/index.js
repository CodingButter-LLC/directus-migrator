"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionMigrator = exports.roleMigrator = exports.schemaMigrator = void 0;
var schema_migration_1 = require("./schema-migration");
Object.defineProperty(exports, "schemaMigrator", { enumerable: true, get: function () { return schema_migration_1.schemaMigrator; } });
var role_migration_1 = require("./role-migration");
Object.defineProperty(exports, "roleMigrator", { enumerable: true, get: function () { return role_migration_1.roleMigrator; } });
var permission_migration_1 = require("./permission-migration");
Object.defineProperty(exports, "permissionMigrator", { enumerable: true, get: function () { return permission_migration_1.permissionMigrator; } });
//# sourceMappingURL=index.js.map