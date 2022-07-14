import { Context } from "../Contexts/Context";

export interface Task {
    getContext(): Context;
    exec(): Promise<Task> | Task[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getResult(): any;
}