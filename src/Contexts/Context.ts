import { MultiTxnMngr } from "../MultiTxnMngr";

export interface Context { 
    init(): Promise<Context>;
    commit(): Promise<Context>;
    rollback(): Promise<Context>;
    isInitialized(): boolean;
    getName(): string;
}