import { Context } from "../Contexts/Context";

import { Task } from "./Task";

export class PopTask implements Task {

    context: Context;
    popFunc: (task: PopTask) => Task[];
    popTasks: Task[] = new Array();

    constructor(context: Context,
        popFunc: (task: PopTask) => Task[]) {
        this.context = context;
        this.popFunc = popFunc;
    }
    getResult() {
        return null;
    }

    getContext(): Context {
        return this.context;
    }

    exec(): Task[] {
        return this.popFunc(this);
    }

}