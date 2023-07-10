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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowsMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Logger_1 = __importDefault(require("../utils/Logger"));
function flowsMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_1.default.info("Migrating Flows Started");
        const flows = yield getUniqueFlows(source, target);
        if (!flows.length) {
            Logger_1.default.info("no new Flows Found");
            return;
        }
        const migratedFlows = yield applyFlows(target, flows);
        if (!migratedFlows) {
            Logger_1.default.error("Flow Migration Failed - Failed to migrate flows");
            return;
        }
        const operations = yield getUniqueOperations(source, target);
        if (!operations.length) {
            Logger_1.default.info("No new Operations Found");
            return;
        }
        const migratedOperations = yield applyOperations(target, operations);
        if (!migratedOperations) {
            Logger_1.default.error("Flow Migration Failed - Failed to migrate operations");
            return;
        }
        Logger_1.default.info("Flow Migration Successful");
        return true;
    });
}
exports.flowsMigrator = flowsMigrator;
const getOperations = (environment) => __awaiter(void 0, void 0, void 0, function* () {
    let { data: operations } = yield (0, CRUD_1.default)({
        method: CRUD_1.Method.GET,
        environment,
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
    });
    if (!operations) {
        return [];
    }
    //make sure operations that depend on other operations come after their dependencies
    return operations;
});
const sortDependencyArray = (operations, index, sorted = []) => {
    const operation = operations[index];
    if (!operation)
        return sorted;
    if (operation.resolve || operation.reject) {
        const resolve_dependency = operations.find((op) => op.id === operation.resolve);
        const resolve_index = resolve_dependency ? operations.indexOf(resolve_dependency) : -1;
        if (resolve_dependency) {
            sorted = sortDependencyArray(operations, resolve_index, sorted);
        }
        const reject_dependency = operations.find((op) => op.id === operation.reject);
        const reject_index = reject_dependency ? operations.indexOf(reject_dependency) : -1;
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
const getFlows = (environment) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield (0, CRUD_1.default)({
        method: CRUD_1.Method.GET,
        environment,
        path: "flows"
    });
    if (!data) {
        Logger_1.default.error("Flow Migration Failed - Failed to get flows");
        return [];
    }
    return data;
});
const applyOperation = (operations, environment, index, response = []) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const operation = operations[index];
        const { data } = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.POST,
            environment,
            path: `operations`,
            data: operation,
            ignoreErrors: true,
        });
        if (operations[index + 1]) {
            resolve(yield applyOperation(operations, environment, index + 1, response));
        }
        else {
            resolve([operation, ...response]);
        }
    }));
});
const applyOperations = (environment, operations) => __awaiter(void 0, void 0, void 0, function* () {
    const migratedOperations = yield applyOperation(operations, environment, 0);
    return migratedOperations;
});
const applyFlows = (environment, flows) => __awaiter(void 0, void 0, void 0, function* () {
    flows = flows.map((_a) => {
        var { operations, user_created } = _a, flow = __rest(_a, ["operations", "user_created"]);
        return (Object.assign({}, flow));
    });
    const migratedFlows = yield (0, CRUD_1.default)({
        method: CRUD_1.Method.POST,
        environment,
        path: "flows",
        data: flows,
    });
    return migratedFlows;
});
const getUniqueFlows = (source, target) => __awaiter(void 0, void 0, void 0, function* () {
    const sourceFlows = yield getFlows(source);
    const targetFlows = yield getFlows(target);
    const uniqueFlows = sourceFlows.filter(({ id }) => !targetFlows.find((flow) => flow.id === id));
    return uniqueFlows;
});
const getUniqueOperations = (source, target) => __awaiter(void 0, void 0, void 0, function* () {
    const sourceOperations = yield getOperations(source);
    const targetOperations = yield getOperations(target);
    let uniqueOperations = sourceOperations.filter(({ id }) => !targetOperations.find((operation) => operation.id === id));
    if (uniqueOperations.length) {
        uniqueOperations = sortDependencyArray(sourceOperations, 0);
        uniqueOperations = uniqueOperations.map((_a) => {
            var { user_created } = _a, operation = __rest(_a, ["user_created"]);
            return (Object.assign({}, operation));
        });
    }
    return uniqueOperations;
});
//# sourceMappingURL=flows-migration.js.map