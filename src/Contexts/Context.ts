import { MultiTxnMngr } from "../MultiTxnMngr";

export interface Context {
    init(multiTxnMngr: MultiTxnMngr): Promise<Context>;
    commit(multiTxnMngr: MultiTxnMngr): Promise<Context>;
    rollback(multiTxnMngr: MultiTxnMngr): Promise<Context>;
    isInitialized(multiTxnMngr: MultiTxnMngr): boolean;
    getName(multiTxnMngr: MultiTxnMngr): string;
}