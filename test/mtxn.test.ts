import { beforeAll, describe, expect, test } from '@jest/globals';
import log4js from "log4js";
import { FunctionContext } from "../src/Contexts/FunctionContext";
import { MultiTxnMngr } from "../src/MultiTxnMngr";
import { FunctionTask } from "../src/Tasks/FunctionTask";
import { Task } from "../src/Tasks/Task";

log4js.configure({
    appenders: { 'out': { type: 'stdout' } },
    categories: { default: { appenders: ['out'], level: 'debug' } }
});

const logger = log4js.getLogger();

describe("Multiple transaction manager workflow test...", () => {

    beforeAll(() => { global.console = require('console'); });

    test("Success-commit case", async () => {

        // init manager & context
        const txnMngr: MultiTxnMngr = new MultiTxnMngr();
        const functionContext = new FunctionContext(txnMngr);

        // Add first step
        functionContext.addTask(
            (task) => { return new Promise((resolve, _) => { console.log("Executing 1. "); resolve(task); }); },
            null, // optional params
            (task) => { return new Promise((resolve, _) => { console.log("Committing 1"); resolve(task); }); },
            (task) => { return new Promise((resolve, _) => { console.log("Rolling back 1"); resolve(task); }); }
        );

        // Add second step
        functionContext.addTask(
            (task) => { return new Promise((resolve, _) => { console.log("Executing 2. "); resolve(task); }); },
            null, // optional params
            (task) => { return new Promise((resolve, _) => { console.log("Committing 2"); resolve(task); }); },
            (task) => { return new Promise((resolve, _) => { console.log("Rolling back 2"); resolve(task); }); }
        );


        await expect(txnMngr.exec()).resolves.not.toBeNull();

    });


    test("Fail-rollback case", async () => {

        // init manager & context
        const txnMngr: MultiTxnMngr = new MultiTxnMngr();
        const functionContext = new FunctionContext(txnMngr);

        // Add first step
        functionContext.addTask(
            (task) => { return new Promise((resolve, _) => { console.log("Executing 1. "); resolve(task); }); },
            null, // optional params
            (task) => { return new Promise((resolve, _) => { console.log("Committing 1"); resolve(task); }); },
            (task) => { return new Promise((resolve, _) => { console.log("Rolling back 1"); resolve(task); }); }
        );

        // Add second step
        functionContext.addTask(
            (_task) => { return new Promise((resolve, reject) => { console.log("Executing 2. "); reject("Don't worry, this should reject according to test scenario."); }); },
            null, // optional params
            (task) => { return new Promise((resolve, _) => { console.log("Committing 2"); resolve(task); }); },
            (task) => { return new Promise((resolve, _) => { console.log("Rolling back 2"); resolve(task); }); }
        );

        // Add third step. Should not execute
        functionContext.addTask(
            (task) => { return new Promise((resolve, _) => { console.log("Executing 3. "); resolve(task) }); },
            null, // optional params
            (task) => { return new Promise((resolve, _) => { console.log("Committing 3"); resolve(task); }); },
            (task) => { return new Promise((resolve, _) => { console.log("Rolling back 3"); resolve(task); }); }
        );

        await expect(txnMngr.exec()).rejects.not.toBeNull();

    });


    test("PopTask test", async () => {

        // init manager & context
        const txnMngr: MultiTxnMngr = new MultiTxnMngr();
        const functionContext = new FunctionContext(txnMngr);

        // Task for Kevin
        const taskForKevin: Task = new FunctionTask(functionContext, (task) => {
            logger.info("I am Kevin");
            task.result = "Kevin";
            return Promise.resolve(task);
        });

        // Task for Bob
        const taskForBob: Task = new FunctionTask(functionContext, (task) => {
            logger.info("I am Bob");
            task.result = "Bob";
            return Promise.resolve(task);
        });

        // Add a task for selecting Bob or Kevin randomly
        const randTask: Task = functionContext.addTask((task) => {
            task.result = ["Bob", "Kevin"][Math.floor(Math.random() * 2)];
            logger.info(task.result + " is selected");
            return Promise.resolve(task);
        });

        // Add a pop task that will add the proper task on the fly... 
        functionContext.addPopTask((popTask) => {
            if (randTask.getResult() === "Kevin") {
                popTask.popTasks.push(taskForKevin);
            } else {
                popTask.popTasks.push(taskForBob);
            }
            return popTask.popTasks;
        });

        await txnMngr.exec();
        if (randTask.getResult() === "Kevin") {
            expect(taskForKevin.getResult()).toBe("Kevin");
            expect(taskForBob.getResult()).toBeNull();
        } else {
            expect(taskForBob.getResult()).toBe("Bob");
            expect(taskForKevin.getResult()).toBeNull();
        }
    });


});
