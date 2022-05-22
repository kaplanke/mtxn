import { MultiTxnMngr } from "../src/MultiTxnMngr";
import { FunctionContext } from "../src/Contexts/FunctionContext";
import log4js from "log4js";

log4js.configure({
    appenders: { 'out': { type: 'stdout' } },
    categories: { default: { appenders: ['out'], level: 'debug' } }
});

const logger = log4js.getLogger();

describe("Multiple transaction manager workflow test...", () => {

    beforeAll(() => { global.console = require('console'); });

    test("Success-commit case", async () => {

        // init manager
        const txnMngr: MultiTxnMngr = new MultiTxnMngr();


        // Add first step
        FunctionContext.addTask(txnMngr,
            (task) => { return new Promise((resolve, reject) => { console.log("Executing 1. "); resolve(task); }); },
            null, // optional params
            (task) => { return new Promise((resolve, reject) => { console.log("Committing 1"); resolve(task); }); },
            (task) => { return new Promise((resolve, reject) => { console.log("Rolling back 1"); resolve(task); }); }
        );

        // Add second step
        FunctionContext.addTask(txnMngr,
            (task) => { return new Promise((resolve, reject) => { console.log("Executing 2. "); resolve(task); }); },
            null, // optional params
            (task) => { return new Promise((resolve, reject) => { console.log("Committing 2"); resolve(task); }); },
            (task) => { return new Promise((resolve, reject) => { console.log("Rolling back 2"); resolve(task); }); }
        );


        await expect(txnMngr.exec()).resolves.not.toBeNull();

    });


    test("Fail-rollback case", async () => {

        // init manager
        const txnMngr: MultiTxnMngr = new MultiTxnMngr();


        // Add first step
        FunctionContext.addTask(txnMngr,
            (task) => { return new Promise((resolve, reject) => { console.log("Executing 1. "); resolve(task); }); },
            null, // optional params
            (task) => { return new Promise((resolve, reject) => { console.log("Committing 1"); resolve(task); }); },
            (task) => { return new Promise((resolve, reject) => { console.log("Rolling back 1"); resolve(task); }); }
        );

        // Add second step
        FunctionContext.addTask(txnMngr,
            (task) => { return new Promise((resolve, reject) => { console.log("Executing 2. "); reject("Don't worry, this should reject according to test scenario."); }); },
            null, // optional params
            (task) => { return new Promise((resolve, reject) => { console.log("Committing 2"); resolve(task); }); },
            (task) => { return new Promise((resolve, reject) => { console.log("Rolling back 2"); resolve(task); }); }
        );

        // Add third step. Should not execute
        FunctionContext.addTask(txnMngr,
            (task) => { return new Promise((resolve, reject) => { console.log("Executing 3. "); resolve(task) }); },
            null, // optional params
            (task) => { return new Promise((resolve, reject) => { console.log("Committing 3"); resolve(task); }); },
            (task) => { return new Promise((resolve, reject) => { console.log("Rolling back 3"); resolve(task); }); }
        );

        await expect(txnMngr.exec()).rejects.not.toBeNull();

    });


});
