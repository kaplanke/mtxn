import { MultiTxnMngr } from "../MultiTxnMngr";
import { FunctionTask } from "../Tasks/FunctionTask";
import { PopTask } from "../Tasks/PopTask";
import { Task } from "../Tasks/Task";
import { Context } from "./Context";

export class FunctionContext implements Context {
    init(multiTxnMngr: MultiTxnMngr): Promise<Context> {
        return Promise.resolve(this);
    }
    commit(multiTxnMngr: MultiTxnMngr): Promise<Context> {
        return new Promise<Context>((resolveCommit, rejectCommit) => {
            const promises: Promise<FunctionTask>[] = [];
            multiTxnMngr.tasks.forEach((task) => {
                if (task instanceof FunctionTask && task.commitFunc) {
                    promises.push(task.commitFunc(task));
                }
            });
            Promise.all(promises)
                .then(() => resolveCommit(this))
                .catch((err) => rejectCommit(err));
        });
    }
    rollback(multiTxnMngr: MultiTxnMngr): Promise<Context> {
        return new Promise<Context>((resolveCommit, rejectCommit) => {
            const promises: Promise<FunctionTask>[] = [];
            multiTxnMngr.tasks.slice(0, multiTxnMngr.lastExecuted).reverse().forEach((task) => {
                if (task instanceof FunctionTask && task.rollbackFunc) {
                    promises.push(task.rollbackFunc(task));
                }
            });
            Promise.all(promises)
                .then(() => resolveCommit(this))
                .catch((err) => rejectCommit(err));
        });
    }

    isInitialized(multiTxnMngr: MultiTxnMngr): boolean {
        return true;
    }

    static contextHandle = new FunctionContext();

    static addTask(txnMngr: MultiTxnMngr,
        execFunc: (task: FunctionTask) => Promise<FunctionTask>,
        params?: any,
        commitFunc?: (task: FunctionTask) => Promise<FunctionTask>,
        rollbackFunc?: (task: FunctionTask) => Promise<FunctionTask>): Task {

        const task = new FunctionTask(
            FunctionContext.contextHandle,
            execFunc,
            params,
            commitFunc,
            rollbackFunc
        );
        txnMngr.addTask(task);
        return task;
    }

    static addPopTask(txnMngr: MultiTxnMngr,
        popFunc: (task: PopTask) => Task[]): PopTask {

        const task = new PopTask(
            FunctionContext.contextHandle,
            popFunc);

        txnMngr.addTask(task);
        return task;
    }

    getName(): string {
        return "Function Context Singleton";
    }

}