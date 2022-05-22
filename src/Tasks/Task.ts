import { Context } from "../Contexts/Context";

export interface Task {

    params: any;
    context: Context;

    getContext(): Context;
    exec(): Promise<Task>;
    setParams(params: object): any;
    getResult(): any;

}