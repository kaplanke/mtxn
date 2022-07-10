import { Context } from "../Contexts/Context";
import { Task } from "./Task";

export class FunctionTask implements Task {

    result: unknown;
    params: unknown;
    context: Context;
    execFunc: (task: FunctionTask) => Promise<FunctionTask>;
    commitFunc: ((task: FunctionTask) => Promise<FunctionTask>) | undefined;
    rollbackFunc: ((task: FunctionTask) => Promise<FunctionTask>) | undefined;

    constructor(context: Context,
        execFunc: (task: FunctionTask) => Promise<FunctionTask>,
        params?: unknown,
        commitFunc?: (task: FunctionTask) => Promise<FunctionTask>,
        rollbackFunc?: (task: FunctionTask) => Promise<FunctionTask>
    ) {
        this.context = context;
        this.execFunc = execFunc;
        this.commitFunc = commitFunc;
        this.rollbackFunc = rollbackFunc;
        this.result = null;
        if (params)
            this.params = params;
    }
    getResult() {
        return this.result;
    }

    setParams(params: unknown) {
        this.params = params;
    }

    getContext(): Context {
        return this.context;
    }

    exec(): Promise<Task> {
        return this.execFunc(this);
    }



}