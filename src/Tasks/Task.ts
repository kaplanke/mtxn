import { Context } from "../Contexts/Context";

export interface Task {

    context: Context;
    getContext(): Context;
    exec(): Promise<Task>;
    getResult(): any;

}