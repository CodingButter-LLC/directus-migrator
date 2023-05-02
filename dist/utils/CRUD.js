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
exports.logErrors = exports.Method = void 0;
const Logger_1 = __importDefault(require("../utils/Logger"));
var Method;
(function (Method) {
    Method["GET"] = "GET";
    Method["POST"] = "POST";
    Method["PATCH"] = "PATCH";
    Method["PUT"] = "PATCH";
    Method["DELETE"] = "DELETE";
})(Method = exports.Method || (exports.Method = {}));
const headers = {
    "Content-Type": "application/json",
};
const URL = (environment, path, params) => {
    if (params)
        params = `&${Object.keys(params)
            .map((key) => `${key}=${params[key]}`)
            .join("&")}`;
    const url = `${environment.endpoint}/${path}?access_token=${environment.accessToken}${params ? params : ""}`;
    return url;
};
function logErrors(errors, url) {
    Logger_1.default.error(`Error in ${url}`);
    errors.forEach((error) => {
        Logger_1.default.error(error);
    });
    process.exit();
}
exports.logErrors = logErrors;
function CRUD({ environment, path, data, params, method = Method.GET, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = URL(environment, path, params);
        Logger_1.default.warn(JSON.stringify({ url, method, data }));
        const response = yield fetch(url, {
            method,
            headers,
            body: data && JSON.stringify(data),
        });
        //check if response status is empty
        if (response.status === 204)
            return false;
        try {
            const json = yield response.json();
            if (json.errors) {
                logErrors(json.errors, url);
            }
            return json;
        }
        catch (e) {
            logErrors([e], url);
        }
    });
}
exports.default = CRUD;
