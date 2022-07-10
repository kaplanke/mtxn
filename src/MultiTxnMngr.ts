import log4js from "@log4js-node/log4js-api";
import { Context } from "./Contexts/Context";
import { PopTask } from "./Tasks/PopTask";
import { Task } from "./Tasks/Task";


export class MultiTxnMngr {

    tasks: Task[] = new Array<Task>();
    lastExecuted: number = 0;
    logger = log4js.getLogger("MultiTxnMngr");

    constructor() {
        // Noop
    }

    addTask(task: Task) {
        this.tasks.push(task);
    }

    async exec(): Promise<Task[]> {
        const tasks = this.tasks;
        const that = this;
        return new Promise((resolveExec, rejectExec) => {
            if (!tasks || tasks.length === 0) {
                this.logger.debug("Empty task list. Resolving...");
                resolveExec(tasks);
            } else {
                new Promise<Task[]>((resolveChain, rejectChain) => {
                    function exec(task: Task) {
                        try {
                            const res: Promise<Task> | Task[] = task.exec();
                            if (Array.isArray(res)) {
                                tasks.splice(that.lastExecuted, 0, ...res);
                                next();
                            } else {
                                (res as (Promise<Task>)).then(() => {
                                    next();
                                }).catch((err) => {
                                    that.logger.error("Transaction failed.", err);
                                    rejectChain(err);
                                });
                            }
                        } catch (err) {
                            that.logger.error("Transaction failed.", err);
                            rejectChain(err);
                        }
                    }
                    function next() {
                        try {
                            if (that.lastExecuted < tasks.length) {
                                const task = tasks[that.lastExecuted++];
                                if (!task || (task as Task).exec === undefined) {
                                    next();
                                } else {
                                    that.logger.debug("Is " + task.getContext().getName(that) + " initialized? " + task.getContext().isInitialized(that));
                                    if (!task.getContext().isInitialized(that)) {
                                        task.getContext().init(that).then(() => {
                                            exec(task);
                                        }).catch((err) => {
                                            that.logger.error("Context init failed.", err);
                                            rejectChain(err);
                                        });
                                    } else {
                                        exec(task);
                                    }
                                }
                            } else {
                                resolveChain(tasks);
                            }
                        } catch (err) {
                            that.logger.error("Transaction failed.", err);
                            rejectChain(err);
                        }
                    }
                    next();
                }).then((_) => {
                    this.commitAll(tasks)
                        .then((__) => resolveExec(tasks))
                        .catch((err) => {
                            that.logger.error("Failed to commit txns. Trying to rollback. Err:" + err);
                            this.rollbackAll(tasks).then(() => {
                                rejectExec(err);
                            }).catch((err2) => {
                                // Nothing to do for rollback failures other than logging o_O
                                that.logger.error(err2);
                                rejectExec(err2);
                            });
                        });
                }).catch((err) => {
                    that.logger.error("Transaction chain failed. Please see previous errors.");
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
                    if (!contextSet.has(task.getContext().getName(this))) {
                        promises.push(task.getContext().commit(this));
                        contextSet.add(task.getContext().getName(this));
                    }
                }
            });
            Promise.all(promises).then(contexts => {
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
                    if (!contextSet.has(task.getContext().getName(this))) {
                        promises.push(task.getContext().rollback(this));
                        contextSet.add(task.getContext().getName(this));
                    }
                }
            });
            Promise.allSettled(promises).then(contexts => {
                this.logger.info("Transaction chain rollbacked.");
                resolveRollback(tasks);
            }).catch((err) => {
                rejectRollback(err);
            });
            this.lastExecuted = 0;
        });
    }

}
