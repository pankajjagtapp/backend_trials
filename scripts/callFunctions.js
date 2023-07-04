require("dotenv").config();
const Web3 = require("web3");
let RPC_URL = `https://goerli.infura.io/v3/${process.env.API_KEY}`;
const web3 = new Web3(RPC_URL);

const solc = require("solc");

const fs = require("fs");

async function main() {
  let file = fs.readFileSync("./contracts/Message.sol").toString();

  let input = {
    language: "Solidity",
    sources: {
      "Message.sol": {
        content: file,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };

  let output = JSON.parse(solc.compile(JSON.stringify(input)));
  //   console.log("Result: ", output);

  ABI = output.contracts["Message.sol"]["Message"].abi;
  bytecode = output.contracts["Message.sol"]["Message"].evm.bytecode.object;
  //   console.log("Bytecode: ", bytecode);
  //   console.log("ABI: ", ABI);

  const myAddress = "0x217e7060913647E910C2A26fF0D6ecD6887C82e8";
  const privateKey = `0x${process.env.PRIVATE_KEY}`;

  contract = new web3.eth.Contract(ABI);

  let contractAddr = "0xC29e4520DcA7Fe619Cc2c658ca7c8c8859ef51e2";
  let deployedContract = new web3.eth.Contract(ABI, contractAddr);
  //   console.log("deployedContract: ", deployedContract);

  await deployedContract.methods.getMessage().call((err, result) => {
    if (!err) {
      console.log(result);
    } else {
      console.log(err);
    }
  });

  await deployedContract.methods.setMessage("Hello World Updated").send(
    (err, result) => {
        if (!err) {
          console.log(result);
        } else {
          console.log(err);
        }
      }
  )

  await deployedContract.methods.getMessage().call((err, result) => {
    if (!err) {
      console.log(result);
    } else {
      console.log(err);
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
