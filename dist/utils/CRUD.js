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
exports.fileCRUD = exports.logErrors = exports.Method = void 0;
const Logger_1 = __importDefault(require("../utils/Logger"));
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
var Method;
(function (Method) {
    Method["GET"] = "GET";
    Method["POST"] = "POST";
    Method["PATCH"] = "PATCH";
    Method["PUT"] = "PATCH";
    Method["DELETE"] = "DELETE";
})(Method || (exports.Method = Method = {}));
const headers = {
    "Content-Type": "application/json",
};
const URL = (environment, path, params) => {
    params = params || {};
    let urlSearchParams = `access_token=${environment.accessToken}&`;
    Object.keys(params).forEach((key) => {
        if (Array.isArray(params[key])) {
            urlSearchParams += params[key].reduce((acc, value) => {
                return acc + `${key}[]=${value}&`;
            }, "");
        }
        else {
            urlSearchParams += `${key}=${params[key]}&`;
        }
    });
    urlSearchParams = urlSearchParams.slice(0, -1);
    return `${environment.endpoint}/${path}?${urlSearchParams}`;
};
function logErrors(errors, url) {
    Logger_1.default.error(`Error in ${url}`);
    errors.forEach((error) => {
        Logger_1.default.error(error);
    });
}
exports.logErrors = logErrors;
function CRUD({ environment, path, data, params, method = Method.GET, ignoreErrors = false }) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = URL(environment, path, params);
        Logger_1.default.debug(JSON.stringify({ url, method, data }));
        const response = yield fetch(url, {
            method,
            headers,
            body: data && JSON.stringify(data),
        });
        //check if response status is empty
        if (response.status === 204) {
            return false;
        }
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
function fileCRUD({ filePath, propertyName, data, id, method = Method.GET }) {
    return __awaiter(this, void 0, void 0, function* () {
        const directoryPath = (0, path_1.resolve)(__dirname, filePath.split("/").slice(0, -1).join("/"));
        const file = (0, path_1.resolve)(__dirname, filePath);
        if (!fs_1.default.existsSync(directoryPath)) {
            fs_1.default.mkdirSync(directoryPath, { recursive: true });
            if (!fs_1.default.existsSync(file)) {
                fs_1.default.writeFileSync(file, "{}");
            }
        }
        const jsonData = JSON.parse(fs_1.default.readFileSync(file, "utf8"));
        if (method === Method.GET) {
            if (id) {
                return jsonData[propertyName].find((item) => item.id === id);
            }
            return jsonData[propertyName];
        }
        if (method === Method.POST || method === Method.PUT) {
            if (id) {
                const index = jsonData[propertyName].findIndex((item) => item.id === id);
                jsonData[propertyName][index] = Object.assign(Object.assign({}, jsonData[propertyName][index]), { data });
                return jsonData[propertyName][index];
            }
            jsonData[propertyName] = Object.assign(Object.assign({}, jsonData[propertyName]), { data });
            return jsonData[propertyName];
        }
        if (method === Method.DELETE) {
            if (id) {
                const index = jsonData[propertyName].findIndex((item) => item.id === id);
                jsonData[propertyName].splice(index, 1);
                return jsonData[propertyName];
            }
            delete jsonData[propertyName];
            return jsonData;
        }
        fs_1.default.writeFileSync(file, JSON.stringify(jsonData));
        return jsonData;
    });
}
exports.fileCRUD = fileCRUD;
//# sourceMappingURL=CRUD.js.map