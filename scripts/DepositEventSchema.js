const mongoose = require("mongoose");

const DepositEventSchema = new mongoose.Schema({
    blockHash: String,
    blockNumber: Number,
    transactionHash: String,
    event: String,
    signature: String,
    stakeProxy: String,
    stakeAmount: Number,
    stakeType: Number,
    user: String,
    blockTimestamp: Number,
    period: Number,
    totalStakedInPool: Number
})

module.exports = mongoose.model("Deposit", DepositEventSchema);