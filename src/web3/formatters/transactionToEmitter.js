import { eventChannel } from "redux-saga";

export default (transaction) => {
    return eventChannel(emitter => {
        transaction
            .on("transactionHash", txHash => {
                console.log("Transaction hash: ", txHash);
                emitter({ type: "TRANSACTION_HASH", payload: txHash });
            })
            .on("receipt", receipt => {
                console.log("Receipt: ", receipt);
                emitter({ type: "RECEIPT", payload: receipt });
            })
            .on("error", error => {
                console.log(error);
                emitter({ type: "ERROR", payload: error });
            });
        return () => false;
    });
};
