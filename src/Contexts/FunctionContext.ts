import { MultiTxnMngr } from "../MultiTxnMngr";
import { FunctionTask } from "../Tasks/FunctionTask";
import { PopTask } from "../Tasks/PopTask";
import { Task } from "../Tasks/Task";
import { Context } from "./Context";
import { v1 } from "uuid";
import { CondTask, CondTaskRet } from "../Tasks/CondTask";

export class FunctionContext implements Context {

    txnMngr: MultiTxnMngr;
    contextId: string;

    constructor(txnMngr: MultiTxnMngr) {
        this.txnMngr = txnMngr;
        this.contextId = v1();
    }

    init(): Promise<Context> {
        return Promise.resolve(this);
    }
    commit(): Promise<Context> {
        return new Promise<Context>((resolveCommit, rejectCommit) => {
            const promises: Promise<FunctionTask>[] = [];
            this.txnMngr.tasks.forEach((task) => {
                if (task instanceof FunctionTask && task.commitFunc) {
                    promises.push(task.commitFunc(task));
                }
            });
            Promise.all(promises)
                .then(() => resolveCommit(this))
                .catch((err) => rejectCommit(err));
        });
    }
    rollback(): Promise<Context> {
        return new Promise<Context>((resolveCommit, rejectCommit) => {
            const promises: Promise<FunctionTask>[] = [];
            this.txnMngr.tasks.slice(0, this.txnMngr.lastExecuted).reverse().forEach((task) => {
                if (task instanceof FunctionTask && task.rollbackFunc) {
                    promises.push(task.rollbackFunc(task));
                }
            });
            Promise.all(promises)
                .then(() => resolveCommit(this))
                .catch((err) => rejectCommit(err));
        });
    }

    isInitialized(): boolean {
        return true;
    }

    addTask(
        execFunc: (task: FunctionTask) => Promise<FunctionTask>,
        params?: unknown,
        commitFunc?: (task: FunctionTask) => Promise<FunctionTask>,
        rollbackFunc?: (task: FunctionTask) => Promise<FunctionTask>): Task {

        const task = new FunctionTask(
            this,
            execFunc,
            params,
            commitFunc,
            rollbackFunc
        );
        this.txnMngr.addTask(task);
        return task;
    }

    addPopTask(popFunc: (task: PopTask) => Task[]): PopTask {
        const task = new PopTask(this, popFunc);
        this.txnMngr.addTask(task);
        return task;
    }

    addCondTask(condFunc: (task: CondTask) => CondTaskRet): CondTask {
        const task = new CondTask(this, condFunc);
        this.txnMngr.addTask(task);
        return task;
    }

    getName(): string {
        return "Function Context: " + this.contextId;
    }
}