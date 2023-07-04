const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema({
    blockHash: String,
    blockNumber: Number,
    transactionHash: String,
    event: String,
    signature: String,
    stakeProxy: String,
    amount: Number,
    stakeType: Number,
    user: String,
    blockTimestamp: Number,
    period: Number,
})

module.exports = new mongoose.model("Claim", ClaimSchema);