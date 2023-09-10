import { Environment } from "../types";
import CRUD, { Method } from "../utils/CRUD";
import logger from "../utils/Logger";
type Flow = {
    [key: string]: any;

}

type Operation = {
    [key: string]: any;
    resolve: string | null;
    reject: string | null;
    id: string;
}

export async function flowsMigrator(source: Environment, target: Environment) {
    logger.info("Migrating Flows Started");
    const flows = await getUniqueFlows(source, target);
    if (!flows.length) {
        logger.info("no new Flows Found");
        return;
    }

    const migratedFlows = await applyFlows(target, flows);
    if (!migratedFlows) {
        logger.error("Flow Migration Failed - Failed to migrate flows");
        return;
    }

    const operations = await getUniqueOperations(source, target);
    if (!operations.length) {
        logger.info("No new Operations Found");
        return;
    }
    const migratedOperations = await applyOperations(target, operations);
    if (!migratedOperations) {
        logger.error("Flow Migration Failed - Failed to migrate operations");
        return;
    }


    logger.info("Flow Migration Successful");
    return true
}

const getOperations = async (environment: Environment): Promise<Operation[] | boolean> => {
    let { data: operations } = await CRUD({
        method: Method.GET,
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
    }) as { data: Operation[] };
    if (!operations) {
        return []
    }
    //make sure operations that depend on other operations come after their dependencies
    return operations;
}

const sortDependencyArray = (operations: Operation[], index: number, sorted: Operation[] = []): Operation[] => {
    const operation = operations[index]
    if (!operation) return sorted
    if (operation.resolve || operation.reject) {
        const resolve_dependency = operations.find((op) => op.id === operation.resolve)
        const resolve_index = resolve_dependency ? operations.indexOf(resolve_dependency) : -1
        if (resolve_dependency) {
            sorted = sortDependencyArray(operations, resolve_index, sorted)
        }
        const reject_dependency = operations.find((op) => op.id === operation.reject)
        const reject_index = reject_dependency ? operations.indexOf(reject_dependency) : -1
        if (reject_dependency) {
            sorted = sortDependencyArray(operations, reject_index, sorted)
        }
    }
    if (!sorted.includes(operation)) {
        sorted.push(operation)
        sorted = sortDependencyArray(operations, index + 1, sorted)
    }
    return sorted
}

const getFlows = async (environment: Environment): Promise<Flow[]> => {

    const { data } = await CRUD({
        method: Method.GET,
        environment,
        path: "flows"
    });
    if (!data) {
        logger.error("Flow Migration Failed - Failed to get flows");
        return []
    }
    return data as Flow[];
}

const applyOperation = async (operations: Operation[], environment: Environment, index: number, response: Operation[] = []): Promise<Operation[]> => {
    return new Promise(async (resolve, reject) => {
        const operation = operations[index]
        const { data } = await CRUD({
            method: Method.POST,
            environment,
            path: `operations`,
            data: operation,
            ignoreErrors: true,
        });
        if (operations[index + 1]) {
            resolve(await applyOperation(operations, environment, index + 1, response))
        } else {
            resolve([operation, ...response])
        }
    });
}

const applyOperations = async (environment: Environment, operations: Operation[]) => {
    const migratedOperations = await applyOperation(operations, environment, 0);
    return migratedOperations;
}

const applyFlows = async (environment: Environment, flows: Flow[]) => {
    flows = flows.map(({ operations, user_created, ...flow }) => ({ ...flow }))
    const migratedFlows = await CRUD({
        method: Method.POST,
        environment,
        path: "flows",
        data: flows,
    });
    return migratedFlows;
}

const getUniqueFlows = async (source: Environment, target: Environment) => {
    const sourceFlows = await getFlows(source);
    const targetFlows = await getFlows(target);
    const uniqueFlows = sourceFlows.filter(({ id }) => !targetFlows.find((flow) => flow.id === id));
    return uniqueFlows;
}
const getUniqueOperations = async (source: Environment, target: Environment) => {
    const sourceOperations = await getOperations(source) as Operation[];
    const targetOperations = await getOperations(target) as Operation[];
    let uniqueOperations = sourceOperations.filter(({ id }) => !targetOperations.find((operation) => operation.id === id));
    if (uniqueOperations.length) {
        uniqueOperations = sortDependencyArray(sourceOperations, 0)
        uniqueOperations = uniqueOperations.map(({ user_created, ...operation }) => ({ ...operation }))
    }
    return uniqueOperations;
}