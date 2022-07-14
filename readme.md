# multiple-transaction-manager

> Multiple transaction manager library provides sequential execution of provided tasks from various transactional contexts.<br>
> All contexts commit if the workflow completes without any exception, otherwise, all contexts are signalled to rollback in the presented order.  

## Features

- __A lightweight plain TypeScript library__
- Powered by provided contexts
- Easy to deploy/integrate

## Install

```sh
npm install multiple-transaction-manager
```

_See the context pages for their installation commands._

## Usage

The basic library provides the _FunctionContext_ class which can be used to create a basic workflow. However more complex scenarios can be handled by using the additional contexts. Please refer the example project for a more detailed use case of the library.  (https://github.com/kaplanke/mtxn-example)
 
```js

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

    // Add this step if you wan to test rollback case ...
    /*
    functionContext.addTask(
        (_task) => { return new Promise((resolve, reject) => { console.log("Executing 2. "); reject("Don't worry, this should reject according to test scenario."); }); },
        null, // optional params
        (task) => { return new Promise((resolve, _) => { console.log("Committing 2"); resolve(task); }); },
        (task) => { return new Promise((resolve, _) => { console.log("Rolling back 2"); resolve(task); }); }
    );
    */

    // Add third step.
    functionContext.addTask(
        (task) => { return new Promise((resolve, _) => { console.log("Executing 3. "); resolve(task) }); },
        null, // optional params
        (task) => { return new Promise((resolve, _) => { console.log("Committing 3"); resolve(task); }); },
        (task) => { return new Promise((resolve, _) => { console.log("Rolling back 3"); resolve(task); }); }
    );

    // jest...
    await expect(txnMngr.exec()).resolves.not.toBeNull();


```
The expected output:

```
Executing 1.
Executing 3.
Committing 1
Committing 3
... [INFO] MultiTxnMngr - Transaction chain completed.

```

## API

### Interfaces

multiple-transaction-manager has two interfaces. Although the basic library provides FunctionContext and additional contexts are already available for different transaction providers like MySQL and MongoDB, you can create your own transaction provider by implementing those interfaces.

#### __Context__

```js
export interface Context {
    init(): Promise<Context>;
    commit(): Promise<Context>;
    rollback(): Promise<Context>;
    isInitialized(): boolean;
    getName(): string;
}
```
#### `init()`
Called once by the transaction manager for initializing the transaction.
-   Returns: {Promise\<Context>} A promise that resolves to the context instance.

#### `commit()`
Called once by the transaction manager after successful completion of all tasks.
-   Returns: {Promise\<Context>} A promise that resolves to the context instance.

#### `rollback()`
Called once by the transaction manager if any of the tasks failed.
-   Returns: {Promise\<Context>} A promise that resolves to the context instance.

#### `isInitialized()`
Called by transaction manager before each task execution to check if the transaction is already initialized.
-   Returns: {Promise\<Context>} A promise that resolves to the context instance.

#### `getName()`
-   Returns: {string} The unique name for the context instance.


#### __Task__

```js
export interface Task {
    getContext(): Context;
    exec(): Promise<Task>;
    getResult(): any;
}
```

#### `getContext()`
-   Returns: {Context} The task's context.
#### `exec()`
Calls the function provided in the execFunc property of the task. 
-   Returns: {Promise\<Task>} A promise that resolves to the task instance.
#### `getResult()`
-   Returns: {any} the result of the task, if any.

### Classes

#### __MultiTxnMngr__
####  `constructor()`
-   Returns: {MultiTxnMngr} The created _MultiTxnMngr_ instance.

#### __FunctionContext__

####  `constructor(txnMngr)`
-   `txnMngr`: _{MultiTxnMngr}_ The multiple transaction manager to bind with the context.
-   Returns: {FunctionContext} The created _FunctionContext_ instance.

#### `addTask(execFunc, params, commitFunc, rollbackFunc)`

Adds a function task to the transaction manager.

-   `execFunc`: _{(task: FunctionTask) => Promise\<FunctionTask>}_ The function to execute during the workflow.
-   `params`: _{Function | Object}_ Parameter to pass to the fnExec function. Can be _null_.
-   `commitFunc`: _{(task: FunctionTask) => Promise\<FunctionTask>}_ Optional function to execute during commit phase.
-   `rollbackFunc`: _{(task: FunctionTask) => Promise\<FunctionTask>}_ Optional function to execute during rollback phase.
-   Returns: {FunctionTask} The created _FunctionTask_ instance.


#### `addPopTask(popTask)`

Adds a task which will generate an array of additional tasks to inject to the task list of the transaction manager. This function is useful to add conditional tasks to the execution list.

-   `popTask`: _{(task: PopTask) => Task[]}_ The function that will generate additional tasks to add to the task list.

#### __FunctionTask__

####  `constructor(context, execFunc, params, commitFunc, rollbackFunc)`
-   `context`: _{Context}_ The _FunctionContext_ to to bind with the task.
-   `execFunc`: _{(task: FunctionTask) => Promise\<FunctionTask>}_ The main function to execute.
-   `params`: _{unknown}_ Optional parameter object.
-   `commitFunc`: _{(task: FunctionTask) => Promise\<FunctionTask>}_ Optional function to execute during commit phase.
-   `rollbackFunc`: _{(task: FunctionTask) => Promise\<FunctionTask>}_ Optional function to execute during rollback phase.
-   Returns: {__FunctionTask__} The created _FunctionTask_ instance.

#### __PopTask__

####  `constructor(context, popFunc)`
-   `context`: _{Context}_ The _FunctionContext_ to to bind with the task.
-   `popFunc`: _{(task: PopTask) => Task[]}_ The function that will generate additional tasks to add to the task list.
-   Returns: {__PopTask__} The created _PopTask_ instance.

## Contexts

Currently the following contexts are available;

- [MongoDb Context](https://www.npmjs.com/package/@multiple-transaction-manager/mongodb)
- [MSSQL Context](https://www.npmjs.com/package/@multiple-transaction-manager/mssql)
- [MySql Context](https://www.npmjs.com/package/@multiple-transaction-manager/mysql)
- [PostgreSQL Context](https://www.npmjs.com/package/@multiple-transaction-manager/pg)
- [Redis Context](https://www.npmjs.com/package/@multiple-transaction-manager/redis)
- [Sequelize Context](https://www.npmjs.com/package/@multiple-transaction-manager/sequelize)

You can leave comment to vote for development of a new context. <br>
https://github.com/users/kaplanke/projects/2 



## Discussions

Although multiple-transaction-manager manages the transactions under normal circumstances, there are still some critical point to consider during the execution of the workflow;
-   If an error occurs during the commit phase of a context, the rollback action is triggered for the entire _MultiTxnMngr_ which may not be able to rollback already committed contexts.
-   You may still have deadlocks during the execution of the workflow if you use the same transaction provider for multiple contexts. (For example if you use Sequelize Context and MySql context at the same _MultiTxnMngr_, you may block both contexts during a reciprocal update statement.)
-   If you like to pass parameters that depends on the execution of the previous tasks, you should use a function ( ()=>{} ) instead of an object. (There is an exception for Redis context, please see the context page for details.)
