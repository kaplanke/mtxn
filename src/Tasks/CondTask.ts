import { Context } from "../Contexts/Context";
import { Task } from "./Task";


export class CondTask implements Task {

    context: Context;
    condFunc: (task: CondTask) => CondTaskRet;
    result?: object;

    constructor(context: Context,
        condFunc: (task: CondTask) => CondTaskRet) {
        this.context = context;
        this.condFunc = condFunc;
    }
    getResult() {
        return this.result;
    }

    getContext(): Context {
        return this.context;
    }

    exec(): CondTaskRet {
        return this.condFunc(this);
    }

}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CondTask {

    export enum RET_CODE {
        BREAK_AND_ROLLBACK = 0,
        BREAK = 1,
        CONTINUE = 2,
    }

}

export class CondTaskRet {
    code: CondTask.RET_CODE;
    params?: object;
    msg?: string;
    constructor(code: CondTask.RET_CODE) {
        this.code = code;
    }
    static CONTINUE(): CondTaskRet {
        return new CondTaskRet(CondTask.RET_CODE.CONTINUE);
    }
    static BREAK(params?: object): CondTaskRet {
        const ret = new CondTaskRet(CondTask.RET_CODE.BREAK);
        ret.params = params;
        return ret;
    }
    static ROLLBACK(msg?: string, params?: object): CondTaskRet {
        const ret = new CondTaskRet(CondTask.RET_CODE.BREAK_AND_ROLLBACK);
        ret.params = params;
        ret.msg = msg;
        return ret;
    }

}
