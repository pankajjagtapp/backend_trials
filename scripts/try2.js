require("dotenv").config();
const Web3 = require("web3");
let RPC_URL = `https://goerli.infura.io/v3/${process.env.API_KEY}`;
const web3 = new Web3(RPC_URL);

const solc = require("solc");

const fs = require("fs");

async function main() {
  const myBalance = await web3.eth.getBalance(
    "0x217e7060913647E910C2A26fF0D6ecD6887C82e8"
  );
  // .then(function (value) {
  //   console.log(web3.utils.fromWei(value, "ether"));
  // });

  console.log("My balance: ", web3.utils.fromWei(String(myBalance), "ether"));
  // console.log("My balance: ", web3.utils.fromWei(web3.utils.toBN(myBalance), "ether"));

  let file = fs.readFileSync("./contracts/Message.sol").toString();
  //   console.log(file);

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

  //   const deployTx = contract.deploy({
  //     data: bytecode,
  //     arguments: [],
  //   });

  //   const nonce = await web3.eth.getTransactionCount(myAddress);
  //   const gasPrice = await web3.eth.getGasPrice();
  //   const gasLimit = 4712388;

  //   const txObject = {
  //     nonce: web3.utils.toHex(nonce),
  //     gasLimit: web3.utils.toHex(gasLimit),
  //     gasPrice: web3.utils.toHex(gasPrice),
  //     data: deployTx.encodeABI(),
  //   };

  //   const signedTx = await web3.eth.accounts.signTransaction(
  //     txObject,
  //     privateKey
  //   );

  //   const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  //   console.log("Contract address:", receipt.contractAddress); // deployed at 0xC29e4520DcA7Fe619Cc2c658ca7c8c8859ef51e2

  let contractAddr = "0xC29e4520DcA7Fe619Cc2c658ca7c8c8859ef51e2";
  let deployedContract = new web3.eth.Contract(ABI, contractAddr);

  await deployedContract.methods.getMessage().call((err, result) => {
    if (!err) {
      console.log(result);
    } else {
      console.log(err);
    }
  });

//   deployedContract.methods
//     .setMessage("Hello World Updated")
//     .send({
//       from: myAddress,
//     })
//     .then((receipt) => {
//       console.log(receipt);
//     });

    const txObject2 = {
      from: myAddress,
      to: contractAddr,
      gas: 21000,
      gasPrice: web3.utils.toWei("10", "gwei"),
      data: deployedContract.methods.setMessage("Hello World Updated")
    };

    web3.eth.accounts
      .signTransaction(txObject2, `0x${process.env.PRIVATE_KEY}`)
      .then((signedTx) => {
        web3.eth
          .sendSignedTransaction(signedTx.rawTransaction)
          .on("receipt", (receipt) => {
            console.log("Transaction receipt", receipt);
          })
          .on("error", (error) => {
            console.log("Transaction Error", error);
          });
      });

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
