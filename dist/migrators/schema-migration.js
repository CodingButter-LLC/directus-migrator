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
exports.applyDiff = exports.getDiff = exports.getSnapshot = exports.schemaMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Logger_1 = __importDefault(require("../utils/Logger"));
/**
 * Runs the Schema Migration
 */
function schemaMigrator(source, target, force) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_1.default.info("Migrating Schema Started");
        const snapshot = yield getSnapshot(source);
        if (!snapshot) {
            Logger_1.default.error("Schema Migration Snapshot Failed");
            return;
        }
        const { diff } = yield getDiff(target, snapshot, force);
        if (!diff) {
            Logger_1.default.warn("No Schema Diff Found");
            return true;
        }
        const applied = yield applyDiff(target, diff);
        if (!applied) {
            Logger_1.default.error("Schema Migration Failed - Failed to apply");
            return false;
        }
        Logger_1.default.info("Schema Migration Successful");
        return true;
    });
}
exports.schemaMigrator = schemaMigrator;
function getSnapshot(environment) {
    return __awaiter(this, void 0, void 0, function* () {
        let snapShot = {};
        if (environment.endpoint.includes("file://")) {
            const filePath = `${environment.endpoint.replace("file://", "")}/schema/snapshot.json`;
            const propertyName = "schema";
            snapShot.data = yield (0, CRUD_1.fileCRUD)({
                method: CRUD_1.Method.GET,
                filePath,
                propertyName,
            });
        }
        else {
            snapShot = yield (0, CRUD_1.default)({
                method: CRUD_1.Method.GET,
                environment,
                path: "schema/snapshot",
            });
        }
        Logger_1.default.info("Schema Migration Snapshot Successful");
        return snapShot === null || snapShot === void 0 ? void 0 : snapShot.data;
    });
}
exports.getSnapshot = getSnapshot;
function getDiff(environment, snapshot, force) {
    return __awaiter(this, void 0, void 0, function* () {
        if (environment.endpoint.includes("file://"))
            return snapshot;
        const diff = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.POST,
            environment,
            path: "schema/diff",
            params: { force },
            data: snapshot,
        });
        Logger_1.default.info("Schema Migration Diff Successful");
        return (diff === null || diff === void 0 ? void 0 : diff.data) || diff;
    });
}
exports.getDiff = getDiff;
function applyDiff(environment, diff) {
    return __awaiter(this, void 0, void 0, function* () {
        if (environment.endpoint.includes("file://")) {
            const filePath = `${environment.endpoint.replace("file://", "")}/schema/schema.json`;
            const propertyName = "schema";
            yield (0, CRUD_1.fileCRUD)({
                method: CRUD_1.Method.POST,
                filePath,
                propertyName,
                data: diff,
            });
            Logger_1.default.info("Schema Migration Apply Successful");
            return true;
        }
        return yield (0, CRUD_1.default)({
            method: CRUD_1.Method.POST,
            environment,
            path: "schema/apply",
            data: diff,
        });
    });
}
exports.applyDiff = applyDiff;
//# sourceMappingURL=schema-migration.js.map