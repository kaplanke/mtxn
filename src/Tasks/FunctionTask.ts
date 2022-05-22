import { Context } from "../Contexts/Context";
import { Task } from "./Task";

export class FunctionTask implements Task {

    params: any;
    context: Context;
    execFunc: (task: FunctionTask) => Promise<FunctionTask>;
    commitFunc: ((task: FunctionTask) => Promise<FunctionTask>) | undefined;
    rollbackFunc: ((task: FunctionTask) => Promise<FunctionTask>) | undefined;

    constructor(context: Context,
        execFunc: (task: FunctionTask) => Promise<FunctionTask>,
        params?: any,
        commitFunc?: (task: FunctionTask) => Promise<FunctionTask>,
        rollbackFunc?: (task: FunctionTask) => Promise<FunctionTask>
    ) {
        this.context = context;
        this.execFunc = execFunc;
        this.commitFunc = commitFunc;
        this.rollbackFunc = rollbackFunc;
        if (params)
            this.params = params;
    }
    getResult() {
        return null;
    }

    setParams(params: any) {
        this.params = params;
    }

    getContext(): Context {
        return this.context;
    }

    exec(): Promise<Task> {
        return this.execFunc(this);
    }



}