"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowsMigrator = void 0;
var CRUD_1 = require("../utils/CRUD");
var Logger_1 = require("../utils/Logger");
function flowsMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function () {
        var flows, migratedFlows, operations, migratedOperations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Logger_1.default.info("Migrating Flows Started");
                    return [4 /*yield*/, getUniqueFlows(source, target)];
                case 1:
                    flows = _a.sent();
                    if (!flows.length) {
                        Logger_1.default.info("no new Flows Found");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, applyFlows(target, flows)];
                case 2:
                    migratedFlows = _a.sent();
                    if (!migratedFlows) {
                        Logger_1.default.error("Flow Migration Failed - Failed to migrate flows");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getUniqueOperations(source, target)];
                case 3:
                    operations = _a.sent();
                    if (!operations.length) {
                        Logger_1.default.info("No new Operations Found");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, applyOperations(target, operations)];
                case 4:
                    migratedOperations = _a.sent();
                    if (!migratedOperations) {
                        Logger_1.default.error("Flow Migration Failed - Failed to migrate operations");
                        return [2 /*return*/];
                    }
                    Logger_1.default.info("Flow Migration Successful");
                    return [2 /*return*/, true];
            }
        });
    });
}
exports.flowsMigrator = flowsMigrator;
var getOperations = function (environment) { return __awaiter(void 0, void 0, void 0, function () {
    var operations;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, CRUD_1.default)({
                    method: CRUD_1.Method.GET,
                    environment: environment,
                    path: "operations",
                    params: {
                        "fields": [
                            "*",
                            "options.*"
                        ],
                        "sort": [
                            "date_created"
                        ]
                    }
                })];
            case 1:
                operations = (_a.sent()).data;
                if (!operations) {
                    return [2 /*return*/, []];
                }
                //make sure operations that depend on other operations come after their dependencies
                return [2 /*return*/, operations];
        }
    });
}); };
var sortDependencyArray = function (operations, index, sorted) {
    if (sorted === void 0) { sorted = []; }
    var operation = operations[index];
    if (!operation)
        return sorted;
    if (operation.resolve || operation.reject) {
        var resolve_dependency = operations.find(function (op) { return op.id === operation.resolve; });
        var resolve_index = resolve_dependency ? operations.indexOf(resolve_dependency) : -1;
        if (resolve_dependency) {
            sorted = sortDependencyArray(operations, resolve_index, sorted);
        }
        var reject_dependency = operations.find(function (op) { return op.id === operation.reject; });
        var reject_index = reject_dependency ? operations.indexOf(reject_dependency) : -1;
        if (reject_dependency) {
            sorted = sortDependencyArray(operations, reject_index, sorted);
        }
    }
    if (!sorted.includes(operation)) {
        sorted.push(operation);
        sorted = sortDependencyArray(operations, index + 1, sorted);
    }
    return sorted;
};
var getFlows = function (environment) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, CRUD_1.default)({
                    method: CRUD_1.Method.GET,
                    environment: environment,
                    path: "flows"
                })];
            case 1:
                data = (_a.sent()).data;
                if (!data) {
                    Logger_1.default.error("Flow Migration Failed - Failed to get flows");
                    return [2 /*return*/, []];
                }
                return [2 /*return*/, data];
        }
    });
}); };
var applyOperation = function (operations, environment, index, response) {
    if (response === void 0) { response = []; }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                    var operation, data, _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                operation = operations[index];
                                return [4 /*yield*/, (0, CRUD_1.default)({
                                        method: CRUD_1.Method.POST,
                                        environment: environment,
                                        path: "operations",
                                        data: operation,
                                        ignoreErrors: true,
                                    })];
                            case 1:
                                data = (_b.sent()).data;
                                if (!operations[index + 1]) return [3 /*break*/, 3];
                                _a = resolve;
                                return [4 /*yield*/, applyOperation(operations, environment, index + 1, response)];
                            case 2:
                                _a.apply(void 0, [_b.sent()]);
                                return [3 /*break*/, 4];
                            case 3:
                                resolve(__spreadArray([operation], response, true));
                                _b.label = 4;
                            case 4: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
};
var applyOperations = function (environment, operations) { return __awaiter(void 0, void 0, void 0, function () {
    var migratedOperations;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, applyOperation(operations, environment, 0)];
            case 1:
                migratedOperations = _a.sent();
                return [2 /*return*/, migratedOperations];
        }
    });
}); };
var applyFlows = function (environment, flows) { return __awaiter(void 0, void 0, void 0, function () {
    var migratedFlows;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                flows = flows.map(function (_a) {
                    var operations = _a.operations, user_created = _a.user_created, flow = __rest(_a, ["operations", "user_created"]);
                    return (__assign({}, flow));
                });
                return [4 /*yield*/, (0, CRUD_1.default)({
                        method: CRUD_1.Method.POST,
                        environment: environment,
                        path: "flows",
                        data: flows,
                    })];
            case 1:
                migratedFlows = _a.sent();
                return [2 /*return*/, migratedFlows];
        }
    });
}); };
var getUniqueFlows = function (source, target) { return __awaiter(void 0, void 0, void 0, function () {
    var sourceFlows, targetFlows, uniqueFlows;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getFlows(source)];
            case 1:
                sourceFlows = _a.sent();
                return [4 /*yield*/, getFlows(target)];
            case 2:
                targetFlows = _a.sent();
                uniqueFlows = sourceFlows.filter(function (_a) {
                    var id = _a.id;
                    return !targetFlows.find(function (flow) { return flow.id === id; });
                });
                return [2 /*return*/, uniqueFlows];
        }
    });
}); };
var getUniqueOperations = function (source, target) { return __awaiter(void 0, void 0, void 0, function () {
    var sourceOperations, targetOperations, uniqueOperations;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getOperations(source)];
            case 1:
                sourceOperations = _a.sent();
                return [4 /*yield*/, getOperations(target)];
            case 2:
                targetOperations = _a.sent();
                uniqueOperations = sourceOperations.filter(function (_a) {
                    var id = _a.id;
                    return !targetOperations.find(function (operation) { return operation.id === id; });
                });
                if (uniqueOperations.length) {
                    uniqueOperations = sortDependencyArray(sourceOperations, 0);
                    uniqueOperations = uniqueOperations.map(function (_a) {
                        var user_created = _a.user_created, operation = __rest(_a, ["user_created"]);
                        return (__assign({}, operation));
                    });
                }
                return [2 /*return*/, uniqueOperations];
        }
    });
}); };
