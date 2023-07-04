require("dotenv").config();
const express = require("express");
app = express();
app.use(express.json());
const Web3 = require("web3");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const DepositEventSchema = require("./DepositEventSchema");

async function main() {
  //   mongoose.connect("mongodb://localhost:27017/TestBhai");
}

main();
