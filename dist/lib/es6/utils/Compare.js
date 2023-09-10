export var deepEqual = function (x, y) {
    if (x === y) {
        return true;
    }
    else if (typeof x === "object" &&
        x !== null &&
        typeof y === "object" &&
        y !== null) {
        if (Object.keys(x).length !== Object.keys(y).length) {
            return false;
        }
        for (var prop in x) {
            if (y.hasOwnProperty(prop)) {
                if (!deepEqual(x[prop], y[prop])) {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
};
export var DeepCompareJson = function (a, b) {
    if (typeof a === "string") {
        try {
            a = JSON.parse(a);
        }
        catch (e) { }
    }
    if (typeof b === "string") {
        try {
            b = JSON.parse(b);
        }
        catch (e) {
            // do nothing
        }
    }
    // if they are not strings then do a deep compare of the value or cerusively call this function
    if (typeof a !== "string" && typeof b !== "string") {
        return deepEqual(a, b);
    }
    return a === b;
};
