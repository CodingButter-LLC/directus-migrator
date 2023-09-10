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
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDiff = exports.getDiff = exports.getSnapshot = exports.schemaMigrator = void 0;
var CRUD_1 = require("../utils/CRUD");
var Logger_1 = require("../utils/Logger");
/**
 * Runs the Schema Migration
 */
function schemaMigrator(source, target, force) {
    return __awaiter(this, void 0, void 0, function () {
        var snapshot, diff, applied;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Logger_1.default.info("Migrating Schema Started");
                    return [4 /*yield*/, getSnapshot(source)];
                case 1:
                    snapshot = _a.sent();
                    if (!snapshot) {
                        Logger_1.default.error("Schema Migration Snapshot Failed");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getDiff(target, snapshot, force)];
                case 2:
                    diff = (_a.sent()).diff;
                    if (!diff) {
                        Logger_1.default.warn("No Schema Diff Found");
                        return [2 /*return*/, true];
                    }
                    return [4 /*yield*/, applyDiff(target, diff)];
                case 3:
                    applied = _a.sent();
                    if (!applied) {
                        Logger_1.default.error("Schema Migration Failed - Failed to apply");
                        return [2 /*return*/, false];
                    }
                    Logger_1.default.info("Schema Migration Successful");
                    return [2 /*return*/, true];
            }
        });
    });
}
exports.schemaMigrator = schemaMigrator;
function getSnapshot(environment) {
    return __awaiter(this, void 0, void 0, function () {
        var snapShot, filePath, propertyName, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    snapShot = {};
                    if (!environment.endpoint.includes("file://")) return [3 /*break*/, 2];
                    filePath = "".concat(environment.endpoint.replace("file://", ""), "/schema/snapshot.json");
                    propertyName = "schema";
                    _a = snapShot;
                    return [4 /*yield*/, (0, CRUD_1.fileCRUD)({
                            method: CRUD_1.Method.GET,
                            filePath: filePath,
                            propertyName: propertyName,
                        })];
                case 1:
                    _a.data = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (0, CRUD_1.default)({
                        method: CRUD_1.Method.GET,
                        environment: environment,
                        path: "schema/snapshot",
                    })];
                case 3:
                    snapShot = _b.sent();
                    _b.label = 4;
                case 4:
                    Logger_1.default.info("Schema Migration Snapshot Successful");
                    return [2 /*return*/, snapShot === null || snapShot === void 0 ? void 0 : snapShot.data];
            }
        });
    });
}
exports.getSnapshot = getSnapshot;
function getDiff(environment, snapshot, force) {
    return __awaiter(this, void 0, void 0, function () {
        var diff;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (environment.endpoint.includes("file://"))
                        return [2 /*return*/, { diff: snapshot }];
                    return [4 /*yield*/, (0, CRUD_1.default)({
                            method: CRUD_1.Method.POST,
                            environment: environment,
                            path: "schema/diff",
                            params: { force: force },
                            data: snapshot,
                        })];
                case 1:
                    diff = _a.sent();
                    Logger_1.default.info("Schema Migration Diff Successful");
                    return [2 /*return*/, (diff === null || diff === void 0 ? void 0 : diff.data) || { diff: diff }];
            }
        });
    });
}
exports.getDiff = getDiff;
function applyDiff(environment, diff) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, propertyName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!environment.endpoint.includes("file://")) return [3 /*break*/, 2];
                    filePath = "".concat(environment.endpoint.replace("file://", ""), "/schema/schema.json");
                    propertyName = "schema";
                    return [4 /*yield*/, (0, CRUD_1.fileCRUD)({
                            method: CRUD_1.Method.POST,
                            filePath: filePath,
                            propertyName: propertyName,
                            data: diff,
                        })];
                case 1:
                    _a.sent();
                    Logger_1.default.info("Schema Migration Apply Successful");
                    return [2 /*return*/, true];
                case 2: return [4 /*yield*/, (0, CRUD_1.default)({
                        method: CRUD_1.Method.POST,
                        environment: environment,
                        path: "schema/apply",
                        data: diff,
                    })];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.applyDiff = applyDiff;
