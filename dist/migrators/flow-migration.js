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
exports.flowMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Logger_1 = __importDefault(require("../utils/Logger"));
function flowMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_1.default.info("Migrating Flows Started");
        const flows = yield getFlows(source);
        if (!flows) {
            Logger_1.default.error("Flow Migration Failed - Failed to get flows");
            return;
        }
        Logger_1.default.info(JSON.stringify(flows));
        const migratedFlows = yield applyFlows(target, flows);
        if (!migratedFlows) {
            Logger_1.default.error("Flow Migration Failed - Failed to migrate flows");
            return;
        }
        Logger_1.default.info("Flow Migration Successful");
        return true;
    });
}
exports.flowMigrator = flowMigrator;
'';
const getFlows = (environment) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield (0, CRUD_1.default)({
        method: CRUD_1.Method.GET,
        environment,
        path: "flows",
    });
    if (!data) {
        Logger_1.default.error("Flow Migration Failed - Failed to get flows");
        return [];
    }
    return data;
});
const applyFlows = (environment, flows) => __awaiter(void 0, void 0, void 0, function* () {
    Logger_1.default.info(flows);
    const migratedFlows = yield (0, CRUD_1.default)({
        method: CRUD_1.Method.POST,
        environment,
        path: "flows?fields[]=operations.*",
        data: flows,
    });
    return migratedFlows;
});
//# sourceMappingURL=flow-migration.js.map