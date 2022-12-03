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

    // Add a task for selecting Bob, Dave, or Kevin randomly
    const randTask: Task = functionContext.addTask((task) => {
        task.result = ["Bob", "Kevin", "Dave"][Math.floor(Math.random() * 3)];
        logger.info(task.result + " is selected");
        return Promise.resolve(task);
    });

    // Add a pop task that will add the proper task on the fly... 
    functionContext.addCondTask((_) => {
        if (randTask.getResult() === "Kevin") { // It' OK Kevin
            return CondTaskRet.BREAK();
        } else if (randTask.getResult() === "Dave") { // Bad Dave
            return CondTaskRet.ROLLBACK("No worries, this is expected for Dave...");
        }
        return CondTaskRet.CONTINUE(); // Bob 
    });

    // Add third step. Should not execute if Dave is selected
    functionContext.addTask(
        (task) => { return new Promise((resolve, _) => { console.log("Executing 3"); resolve(task) }); },
        null, // optional params
        (task) => { return new Promise((resolve, _) => { console.log("On Txn Commit 3"); resolve(task); }); },
        (task) => { return new Promise((resolve, _) => { console.log("On Txn Rollback 3"); resolve(task); }); }
    );

    txnMngr.exec().then(_ => {
        expect(randTask.getResult()).not.toBe("Dave");
    }).catch(err => { 
        logger.debug(err);
        expect(randTask.getResult()).toBe("Dave");
    });

```

The expected output:

If Dave is randomly selected
```
[INFO] default - Dave is selected
[DEBUG] MultiTxnMngr - Transaction quitting with rollback!
[ERROR] MultiTxnMngr - Transaction chain failed. Please see previous errors.
[INFO] MultiTxnMngr - Transaction chain rollbacked.
[DEBUG] default - No worries, this is expected for Dave...
```

If Kevin is randomly selected
```
[INFO] default - Kevin is selected
[DEBUG] MultiTxnMngr - Transaction quitting without rollback...
[INFO] MultiTxnMngr - Transaction chain completed.
```

If Bob is randomly selected
```
[INFO] default - Bob is selected
[DEBUG] MultiTxnMngr - Condition OK. Continuing transaction...
Executing 3.
On Txn Commit 3
[INFO] MultiTxnMngr - Transaction chain completed.
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

#### __CondTask__

####  `constructor(context, condFunc)`
-   `context`: _{Context}_ The _FunctionContext_ to to bind with the task.
-   `condFunc`: _{(task: CondTask) => CondTaskRet}_ The function that will evaluate the current condition and return the proper _CondTaskRet_. 
-   Returns: {__CondTask__} The created _CondTaskRet_ instance.

#### __CondTaskRet__

####  `CondTaskRet.CONTINUE()`
-   Returns: {__CondTaskRet__} The created _CondTaskRet_ instance which allows the transaction flow without any intervention.

####  `CondTaskRet.BREAK(params)`
-   `params`: _{object}_ Additional parameters which will be available as the result of the task after execution.
-   Returns: {__CondTaskRet__} The created _CondTaskRet_ instance which makes the transaction to commit immediately without executing any consecutive tasks.

####  `CondTaskRet.ROLLBACK(msg, params)`
-   `msg`: _{Context}_ The _FunctionContext_ to to bind with the task.
-   `params`: {object} Additional parameters which will be available as the result of the task after execution.
-   Returns: {__CondTaskRet__} The created _CondTaskRet_ instance which makes the transaction to rollback immediately with the provided message.


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

## Release Notes

### 1.0.5

-   CondTask introduced
-   Pg adapter txn begin fix

### 1.0.4

-   PopTask introduced

