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
import logger from "../utils/Logger";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
export var Method;
(function (Method) {
    Method["GET"] = "GET";
    Method["POST"] = "POST";
    Method["PATCH"] = "PATCH";
    Method["PUT"] = "PATCH";
    Method["DELETE"] = "DELETE";
})(Method || (Method = {}));
var headers = {
    "Content-Type": "application/json",
};
var URL = function (environment, path, params) {
    params = params || {};
    var urlSearchParams = "access_token=".concat(environment.accessToken, "&");
    Object.keys(params).forEach(function (key) {
        if (Array.isArray(params[key])) {
            urlSearchParams += params[key].reduce(function (acc, value) {
                return acc + "".concat(key, "[]=").concat(value, "&");
            }, "");
        }
        else {
            urlSearchParams += "".concat(key, "=").concat(params[key], "&");
        }
    });
    urlSearchParams = urlSearchParams.slice(0, -1);
    return "".concat(environment.endpoint, "/").concat(path, "?").concat(urlSearchParams);
};
export function logErrors(errors, url) {
    logger.error("Error in ".concat(url));
    errors.forEach(function (error) {
        logger.error(error);
    });
}
export default function CRUD(_a) {
    var environment = _a.environment, path = _a.path, data = _a.data, params = _a.params, _b = _a.method, method = _b === void 0 ? Method.GET : _b, _c = _a.ignoreErrors, ignoreErrors = _c === void 0 ? false : _c;
    return __awaiter(this, void 0, void 0, function () {
        var url, response, json, e_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    url = URL(environment, path, params);
                    logger.debug(JSON.stringify({ url: url, method: method, data: data }));
                    return [4 /*yield*/, fetch(url, {
                            method: method,
                            headers: headers,
                            body: data && JSON.stringify(data),
                        })
                        //check if response status is empty
                    ];
                case 1:
                    response = _d.sent();
                    //check if response status is empty
                    if (response.status === 204) {
                        return [2 /*return*/, false];
                    }
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, response.json()];
                case 3:
                    json = _d.sent();
                    if (json.errors) {
                        logErrors(json.errors, url);
                    }
                    return [2 /*return*/, json];
                case 4:
                    e_1 = _d.sent();
                    logErrors([e_1], url);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function fileCRUD(_a) {
    var filePath = _a.filePath, propertyName = _a.propertyName, data = _a.data, id = _a.id, _b = _a.method, method = _b === void 0 ? Method.GET : _b;
    return __awaiter(this, void 0, void 0, function () {
        var directoryPath, file, jsonData, index, index;
        return __generator(this, function (_c) {
            directoryPath = resolve(__dirname, filePath.split("/").slice(0, -1).join("/"));
            file = resolve(__dirname, filePath);
            if (!existsSync(directoryPath)) {
                mkdirSync(directoryPath, { recursive: true });
                if (!existsSync(file)) {
                    writeFileSync(file, "{}");
                }
            }
            jsonData = JSON.parse(readFileSync(file, "utf8"));
            if (method === Method.GET) {
                if (id) {
                    return [2 /*return*/, jsonData[propertyName].find(function (item) { return item.id === id; })];
                }
                return [2 /*return*/, jsonData[propertyName]];
            }
            if (method === Method.POST || method === Method.PUT) {
                if (id) {
                    index = jsonData[propertyName].findIndex(function (item) { return item.id === id; });
                    jsonData[propertyName][index] = __assign(__assign({}, jsonData[propertyName][index]), { data: data });
                    return [2 /*return*/, jsonData[propertyName][index]];
                }
                jsonData[propertyName] = __assign(__assign({}, jsonData[propertyName]), { data: data });
                return [2 /*return*/, jsonData[propertyName]];
            }
            if (method === Method.DELETE) {
                if (id) {
                    index = jsonData[propertyName].findIndex(function (item) { return item.id === id; });
                    jsonData[propertyName].splice(index, 1);
                    return [2 /*return*/, jsonData[propertyName]];
                }
                delete jsonData[propertyName];
                return [2 /*return*/, jsonData];
            }
            writeFileSync(file, JSON.stringify(jsonData));
            return [2 /*return*/, jsonData];
        });
    });
}
