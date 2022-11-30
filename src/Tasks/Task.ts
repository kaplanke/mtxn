import { Context } from "../Contexts/Context";
import { CondTaskRet } from "./CondTask";

export interface Task {
    getContext(): Context;
    exec(): Promise<Task> | Task[] | CondTaskRet;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getResult(): any;
}