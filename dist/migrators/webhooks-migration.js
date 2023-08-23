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
exports.webhookMigrator = void 0;
const CRUD_1 = __importStar(require("../utils/CRUD"));
const Compare_1 = require("../utils/Compare");
const Logger_js_1 = __importDefault(require("../utils/Logger.js"));
function filterAndMutateWebhooks(webhooks) {
    return webhooks.map((webhook) => (Object.assign(Object.assign({}, webhook), { uid: `${webhook.id}` })));
}
/**
 *
 * @param sourceWebhooks
 * @param targetWebhooks
 * @returns { createdWebhooks: Webhook[], updatedWebhooks: Webhook[], deletedWebhooks: Webhook[]}
 * @description Compares the webhooks from the source and target using the uid(compiled from unique keys) environments and returns the webhooks that need to be created, updated and deleted
 */
function getWebhookAction(sourceWebhooks, targetWebhooks) {
    const createdWebhooks = sourceWebhooks
        .filter((sourceWebhook) => {
        return !targetWebhooks.find(({ uid }) => (sourceWebhook === null || sourceWebhook === void 0 ? void 0 : sourceWebhook.uid) === uid);
    })
        .map((sourceWebhook) => {
        const { uid, id } = sourceWebhook, webhook = __rest(sourceWebhook, ["uid", "id"]);
        return webhook;
    });
    const updatedWebhooksCandidates = sourceWebhooks
        .filter((sourceWebhook) => {
        return targetWebhooks.find(({ uid }) => sourceWebhook.uid === uid);
    })
        .map((sourceWebhook) => {
        return {
            sourceWebhook,
            targetWebhook: targetWebhooks.find(({ uid }) => sourceWebhook.uid === uid),
        };
    });
    //use deep compare to check if the webhooks are the same
    const updatedWebhooks = updatedWebhooksCandidates
        .filter(({ sourceWebhook, targetWebhook }) => {
        const { uid: sourceUID, id: sourceID } = sourceWebhook, sourceWebhookWithoutID = __rest(sourceWebhook, ["uid", "id"]);
        const _a = targetWebhook || { uuid: null, id: null }, { uid: targetUID, id: targetID } = _a, targetWebhookWithoutID = __rest(_a, ["uid", "id"]);
        return !(0, Compare_1.DeepCompareJson)(sourceWebhookWithoutID, targetWebhookWithoutID);
    })
        .map(({ sourceWebhook, targetWebhook }) => {
        const { uid, id: sourceId } = sourceWebhook, webhook = __rest(sourceWebhook, ["uid", "id"]);
        const id = targetWebhook === null || targetWebhook === void 0 ? void 0 : targetWebhook.id;
        return Object.assign(Object.assign({}, webhook), { id });
    });
    const deletedWebhooks = targetWebhooks.filter((targetWebhook) => {
        return !sourceWebhooks.find(({ uid }) => {
            return uid === targetWebhook.uid;
        });
    });
    return { createdWebhooks, updatedWebhooks, deletedWebhooks };
}
function getWebhooks(environment) {
    return __awaiter(this, void 0, void 0, function* () {
        const privateWebhooks = yield (0, CRUD_1.default)({
            method: CRUD_1.Method.GET,
            environment,
            path: "webhooks",
            params: {
                "filter[id][_nnull]": true,
                limit: -1,
            },
        });
        return privateWebhooks === null || privateWebhooks === void 0 ? void 0 : privateWebhooks.data;
    });
}
function clearWebhooks(environment, ids) {
    return __awaiter(this, void 0, void 0, function* () {
        ids.forEach((id) => __awaiter(this, void 0, void 0, function* () {
            yield (0, CRUD_1.default)({
                method: CRUD_1.Method.DELETE,
                environment,
                path: `webhooks${id ? `/${id}` : ""}`,
                params: {
                    "filter[id][_nnull]": true,
                    limit: -1,
                },
            });
        }));
    });
}
function executeWebhookAction({ method, environment, webhooks, id, successMessage, failMessage, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const reqResponse = yield (0, CRUD_1.default)({
            method,
            environment,
            path: `webhooks${id ? `/${id}` : ""}`,
            data: webhooks,
        });
        Logger_js_1.default.info(successMessage(reqResponse.data));
        return reqResponse.data;
    });
}
/**
 * Runs the webhook migration
 */
function webhookMigrator(source, target) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger_js_1.default.info("Migrating Webhooks");
        let targetWebhooks = filterAndMutateWebhooks(yield getWebhooks(target));
        yield clearWebhooks(target, targetWebhooks === null || targetWebhooks === void 0 ? void 0 : targetWebhooks.map((item) => item.id));
        targetWebhooks = [];
        const sourceWebhooks = filterAndMutateWebhooks(yield getWebhooks(source));
        if (sourceWebhooks.length > 0) {
            const { createdWebhooks, updatedWebhooks, deletedWebhooks } = getWebhookAction(sourceWebhooks, targetWebhooks);
            Logger_js_1.default.info(`Created: ${createdWebhooks.length}, Updated: ${updatedWebhooks.length}, Deleted: ${deletedWebhooks.length}`);
            if (createdWebhooks.length > 0) {
                yield executeWebhookAction({
                    method: CRUD_1.Method.POST,
                    environment: target,
                    webhooks: createdWebhooks,
                    successMessage: (_data) => `Created ${createdWebhooks.length} Webhook/s`,
                    failMessage: (_response) => `Failed to create Webhook`,
                });
            }
            if (updatedWebhooks.length > 0) {
                yield Promise.all(updatedWebhooks.map((webhooks, index) => __awaiter(this, void 0, void 0, function* () {
                    const { id } = webhooks;
                    return yield executeWebhookAction({
                        method: CRUD_1.Method.PATCH,
                        webhooks,
                        environment: target,
                        id,
                        successMessage: (_data) => `Updated Webhook ${index} with id:${id}`,
                        failMessage: (_response) => `Failed to Update Webhook ${index} with id:${id}`,
                    });
                })));
                Logger_js_1.default.info(`Updated ${updatedWebhooks.length} Webhooks`);
                return true;
            }
            if (deletedWebhooks.length) {
                const ids = deletedWebhooks.map(({ id }) => id);
                yield executeWebhookAction({
                    method: CRUD_1.Method.DELETE,
                    environment: target,
                    id: ids.length === 1 ? ids[0] : undefined,
                    webhooks: ids.length > 1 ? ids : undefined,
                    successMessage: (_data) => `Deleted ${ids.length} Webhook/s`,
                    failMessage: (_response) => `Failed to delete ${ids.length} Webhook/s`,
                });
            }
        }
        Logger_js_1.default.info("Migrating Webhooks Complete");
    });
}
exports.webhookMigrator = webhookMigrator;
//# sourceMappingURL=webhooks-migration.js.map