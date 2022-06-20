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
import { MultiTxnMngr, FunctionContext, Task } from "multiple-transaction-manager";

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

 // Uncomment this step if you want to test rollback case
 /*
FunctionContext.addTask(txnMngr,
    (task) => { return new Promise((resolve, reject) => { console.log("Executing 2. "); reject("Don't worry, this should reject according to test scenario."); }); },
    null, // optional params
    (task) => { return new Promise((resolve, reject) => { console.log("Committing 2"); resolve(task); }); },
    (task) => { return new Promise((resolve, reject) => { console.log("Rolling back 2"); resolve(task); }); }
);
*/

// jest...
await expect(txnMngr.exec()).resolves.not.toBeNull();
```

## API

### Interfaces

multiple-transaction-manager has two interfaces. Although the basic library provides FunctionContext and additional contexts are already available for different transaction providers like MySQL and MongoDB, you can create your own transaction provider by implementing those interfaces.

#### Context

```js
export interface Context {
    init(multiTxnMngr: MultiTxnMngr): Promise<Context>;
    commit(multiTxnMngr: MultiTxnMngr): Promise<Context>;
    rollback(multiTxnMngr: MultiTxnMngr): Promise<Context>;
    isInitialized(multiTxnMngr: MultiTxnMngr): boolean;
    getName(multiTxnMngr: MultiTxnMngr): string;
}
```

#### Task

```js
export interface Task {

    context: Context;
    getContext(): Context;
    exec(): Promise<Task>;
    getResult(): any;

}
```

### Classes

The default library provides the _FunctionContext_ singleton class with the following method;

#### `FunctionContext.addTask(fnExec, params, fnCommit, fnRollback)`

Static method to add a _FunctionTask_ to the _MultiTxnMngr_.

-   `fnExec`: _{(task: FunctionTask) => Promise\<FunctionTask>}_ The function to execute during the workflow.
-   `params`: _{Function | Object}_ Parameter to pass to the fnExec function. Can be _null_.
-   `fnCommit`: _{(task: FunctionTask) => Promise\<FunctionTask>}_ Optional function to execute during commit phase.
-   `fnRollback`: _{(task: FunctionTask) => Promise\<FunctionTask>}_ Optional function to execute during rollback phase.
-   Returns: {FunctionTask} Returns the created FunctionTask instance.


## Contexts

Currently the following contexts are available;

- [MongoDb Context](https://www.npmjs.com/package/@multiple-transaction-manager/mongodb)
- [MSSQL Context](https://www.npmjs.com/package/@multiple-transaction-manager/mssql)
- [MySql Context](https://www.npmjs.com/package/@multiple-transaction-manager/mysql)
- [PostgreSQL Context](https://www.npmjs.com/package/@multiple-transaction-manager/pg)
- [Redis Context](https://www.npmjs.com/package/@multiple-transaction-manager/redis)
- [Sequelize Context](https://www.npmjs.com/package/@multiple-transaction-manager/sequelize)

You can up-vote or leave comment to vote for an additional context development. 



## Discussions

Although multiple-transaction-manager manages the transactions under normal circumstances, there are still some critical point to consider during the execution of the workflow;
-   If an error occurs during the commit phase of a context, the rollback action is triggered for the entire _MultiTxnMngr_ which may not be able to rollback already committed contexts.
-   You may still have deadlocks during the execution of the workflow if you use the same transaction provider for multiple contexts. (For example if you use Sequelize Context and MySql context at the same _MultiTxnMngr_, you may block both contexts during a reciprocal update statement.)
-   If you like to pass parameters that depends on the execution of the previous tasks, you should use a function ( ()=>{} ) instead of an object. (There is an exception for Redis context, please see the context page for details.)
