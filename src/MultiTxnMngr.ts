import log4js from "@log4js-node/log4js-api";
import { Context } from "./Contexts/Context";
import { CondTask, CondTaskRet } from "./Tasks/CondTask";
import { Task } from "./Tasks/Task";


export class MultiTxnMngr {

    tasks: Task[] = new Array<Task>();
    lastExecuted = 0;
    logger = log4js.getLogger("MultiTxnMngr");

    constructor() {
        // Noop
    }

    addTask(task: Task) {
        this.tasks.push(task);
    }

    async exec(): Promise<Task[]> {
        const tasks = this.tasks;
        return new Promise((resolveExec, rejectExec) => {
            if (!tasks || tasks.length === 0) {
                this.logger.debug("Empty task list. Resolving...");
                resolveExec(tasks);
            } else {
                new Promise<Task[]>((resolveChain, rejectChain) => {
                    function exec(task: Task, txnMngr: MultiTxnMngr) {
                        try {
                            const res: Promise<Task> | Task[] | CondTaskRet = task.exec();
                            if (Array.isArray(res)) {
                                tasks.splice(txnMngr.lastExecuted, 0, ...res);
                                next(txnMngr);
                            } else if (res instanceof CondTaskRet) {
                                (task as CondTask).result = res.params;
                                if (res.code == CondTask.RET_CODE.CONTINUE) {
                                    txnMngr.logger.debug("Condition OK. Continuing transaction...");
                                    next(txnMngr);
                                } else if (res.code == CondTask.RET_CODE.BREAK) {
                                    txnMngr.logger.debug("Transaction quitting without rollback...");
                                    resolveChain(tasks);
                                } else {
                                    txnMngr.logger.debug("Transaction quitting with rollback!");
                                    if (res.msg) {
                                        rejectChain(res.msg);
                                    } else {
                                        rejectChain("Transaction rolling back because of condition task!");
                                    }
                                }
                            } else {
                                (res as (Promise<Task>)).then(() => {
                                    next(txnMngr);
                                }).catch((err) => {
                                    txnMngr.logger.error("Transaction failed.", err);
                                    rejectChain(err);
                                });
                            }
                        } catch (err) {
                            txnMngr.logger.error("Transaction failed.", err);
                            rejectChain(err);
                        }
                    }
                    function next(txnMngr: MultiTxnMngr) {
                        try {
                            if (txnMngr.lastExecuted < tasks.length) {
                                const task = tasks[txnMngr.lastExecuted++];
                                if (!task || (task as Task).exec === undefined) {
                                    next(txnMngr);
                                } else {
                                    txnMngr.logger.debug(
                                        "Is " + task.getContext().getName()
                                        + " initialized? " + task.getContext().isInitialized()
                                    );
                                    if (!task.getContext().isInitialized()) {
                                        task.getContext().init().then(() => {
                                            exec(task, txnMngr);
                                        }).catch((err) => {
                                            txnMngr.logger.error("Context init failed.", err);
                                            rejectChain(err);
                                        });
                                    } else {
                                        exec(task, txnMngr);
                                    }
                                }
                            } else {
                                resolveChain(tasks);
                            }
                        } catch (err) {
                            txnMngr.logger.error("Transaction failed.", err);
                            rejectChain(err);
                        }
                    }
                    next(this);
                }).then((_) => {
                    this.commitAll(tasks)
                        .then((__) => resolveExec(tasks))
                        .catch((err) => {
                            this.logger.error("Failed to commit txns. Trying to rollback. Err:" + err);
                            this.rollbackAll(tasks).then(() => {
                                rejectExec(err);
                            }).catch((err2) => {
                                // Nothing to do for rollback failures other than logging o_O
                                this.logger.error(err2);
                                rejectExec(err2);
                            });
                        });
                }).catch((err) => {
                    this.logger.error("Transaction chain failed. Please see previous errors.");
                    this.rollbackAll(tasks).finally(() => {
                        rejectExec(err);
                    });
                })
            }
        });
    }

    commitAll(tasks: Task[]): Promise<Task[]> {
        return new Promise<Task[]>((resolveCommits, rejectCommits) => {
            const promises: Promise<Context>[] = [];
            const contextSet: Set<string> = new Set();
            tasks.forEach(task => {
                if (task && (task as Task).getContext !== undefined && task.getContext()) {
                    if (!contextSet.has(task.getContext().getName())) {
                        promises.push(task.getContext().commit());
                        contextSet.add(task.getContext().getName());
                    }
                }
            });
            Promise.all(promises).then((_contexts) => {
                this.logger.info("Transaction chain completed.");
                resolveCommits(tasks);
            }).catch((err) => {
                rejectCommits(err);
            });
            this.lastExecuted = 0;
        });
    }


    rollbackAll(tasks: Task[]): Promise<Task[]> {
        return new Promise<Task[]>((resolveRollback, rejectRollback) => {
            const promises: Promise<Context>[] = [];
            const contextSet: Set<string> = new Set();
            tasks.slice(0, this.lastExecuted).reverse().forEach(task => {
                if (task && (task as Task).getContext !== undefined && task.getContext()) {
                    if (!contextSet.has(task.getContext().getName())) {
                        promises.push(task.getContext().rollback());
                        contextSet.add(task.getContext().getName());
                    }
                }
            });
            Promise.allSettled(promises).then((_contexts) => {
                this.logger.info("Transaction chain rollbacked.");
                resolveRollback(tasks);
            }).catch((err) => {
                rejectRollback(err);
            });
            this.lastExecuted = 0;
        });
    }

}
