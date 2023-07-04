import Config from "../config/configLocal";
import userDataModel from "../models/userData.model";
import userHistoryModel from "../models/userHistory.model";
import blockInfoModel from "../models/blockInfo.model";
import NFPMeventModels from "../models/NFPMevent.models";
// import createMQProducer from "../helpers/rabbitMQ.emitter";
// const producer = createMQProducer(Config.RABBIT_MQ as string, "GTK");

class UserEvents {
  private web3Instance: any;

  constructor() {
    console.log("Staker Address: ", Config.STAKER_ADDRESS);
    console.log("Pool Address: ", Config.POOL_ADDRESS);

    this.web3Instance = Config.WEB3INSTANCE;
  }

  private extractAddress = (byte: any) => {
    let count = 0;  
    byte = byte.slice(2);

    for (let i = 0; i < byte.length; i++) {
      if (byte[i] == 0) {
        count++;
      } else if (byte[i] != 0) {
        break;
      }
    }
    let data = byte.slice(count);
    return data;
  };

  public getUserHistoryEvents = async () => {
    try {
      const block: any = await blockInfoModel.findOne({
        address: Config.STAKER_ADDRESS,
      });
      console.log(
        "blockNumber",
        block?.blockNumber || Config.STAKER_BLOCK_NUMBER
      );

      const STAKER_ABI: any = Config.STAKER_ABI;
      const stakerContractInstance: any =
        new Config.POLYGON_WEB3INSTANCE.eth.Contract(
          STAKER_ABI,
          Config.STAKER_ADDRESS?.toString()
        );

      const result: any = await stakerContractInstance.getPastEvents(
        "allEvents",
        {
          fromBlock: block?.blockNumber || Config.STAKER_BLOCK_NUMBER,
          toBlock: "latest",
        }
      );

      // console.log(result);
      let lastBlock;
      for (let i = 0; i < result.length; i++) {
        if (result[i].event == "Staked") {
          // console.log(result[i].timestamp , "---------------");
          // console.log(result[i].returnValues.currentTime , "---------------");

          await userDataModel.findOneAndUpdate(
            {
              userAddress: result[i].returnValues.user.toString().toLowerCase(),
            },
            {
              $push: {
                StakedTokens: result[i].returnValues.tokenId.toString(),
                StakedTokenDetails: {
                  stakedTokenId: result[i].returnValues.tokenId.toString(),
                  txnHash: result[i].transactionHash,
                  timestamp: result[i].returnValues.currentTime,
                },
              },
            },
            { upsert: true }
          );
          // console.log();

          await userHistoryModel.create({
            blockNumber: result[i].blockNumber,
            txnHash: result[i].transactionHash,
            kind: result[i].event,
            userAddress: result[i].returnValues.user.toString().toLowerCase(),
            timestamp: result[i].returnValues.currentTime,
            tokenId: result[i].returnValues.tokenId,
          });
        } else if (result[i].event == "Unstaked") {
          // console.log(result[i].returnValues.user.toString().toLowerCase());
          // console.log(result[i].returnValues.tokenId.toString());
          const t = await userDataModel.updateOne(
            {
              userAddress: result[i].returnValues.user.toString().toLowerCase(),
            },
            {
              $pull: {
                StakedTokens: result[i].returnValues.tokenId.toString(),
                StakedTokenDetails: {
                  stakedTokenId: result[i].returnValues.tokenId.toString(),
                  // txnHash: result[i].transactionHash,
                  // timestamp: result[i].timestamp,
                },
              },
            }
            // { upsert: true }
          );

          await userHistoryModel.create({
            blockNumber: result[i].blockNumber,
            txnHash: result[i].transactionHash,
            kind: result[i].event,
            userAddress: result[i].returnValues.user.toString().toLowerCase(),
            timestamp: result[i].returnValues.currentTime,
            tokenId: result[i].returnValues.tokenId,
          });
          // console.log(t, "ttttttttttttttttttttttt");
          lastBlock = result[i].blockNumber;
        }
      }
      console.log("LAST BLOCK", lastBlock);

      await blockInfoModel.updateOne(
        { address: Config.STAKER_ADDRESS },
        { blockNumber: Number(lastBlock) + 1 },
        { upsert: true }
      );

      let blockNum: any = await blockInfoModel.find({
        address: Config.STAKER_ADDRESS,
      });

      let subscription = this.web3Instance.eth
        .subscribe("logs", {
          fromBlock: blockNum.blockNumber,
          address: Config.STAKER_ADDRESS,
        })
        .on("connected", function (subscriptionId: any) {
          console.log("subscriptionId", subscriptionId);
        })
        .on("data", async (log: any) => {
          let mainData;

          if (
            log.topics[0] ==
            "0x204fccf0d92ed8d48f204adb39b2e81e92bad0dedb93f5716ca9478cfb57de00"
          ) {
            console.log("Unstaked");

            const userAddress = `0x${this.extractAddress(log.topics[1])
              .toString()
              .toLowerCase()}`;
            const currentTime = await this.web3Instance.utils.hexToNumberString(
              log.topics[2]
            );
            const tokenId = await this.web3Instance.utils.hexToNumberString(
              log.topics[3]
            );
            console.log("Unstake from web3.subscribe >>>>>>>>>>>>", tokenId);

            mainData = {
              kind: "Unstaked",
              txnHash: log.transactionHash,
              userAddress: userAddress,
              timestamp: currentTime,
              tokenId: tokenId,
            };

            await userHistoryModel.create(mainData);

            const x = await userDataModel.findOneAndUpdate(
              { userAddress: userAddress },
              {
                $pull: {
                  StakedTokens: tokenId,
                  StakedTokenDetails: {
                    stakedTokenId: tokenId,
                  },
                },
              }
            );
            console.log(
              "=====================================================================",
              x
            );

            console.log("Removed from User Data Collection");
          } else if (
            log.topics[0] ==
            "0x1449c6dd7851abc30abf37f57715f492010519147cc2652fbc38202c18a6ee90"
          ) {
            console.log("Staked");

            const userAddress = `0x${this.extractAddress(log.topics[1])
              .toString()
              .toLowerCase()}`;
            const currentTime = await this.web3Instance.utils.hexToNumberString(
              log.topics[2]
            );
            const tokenId = await this.web3Instance.utils.hexToNumberString(
              log.topics[3]
            );
            console.log("Stake from web3.subscribe >>>>>>>>", tokenId);

            mainData = {
              kind: "Staked",
              txnHash: log.transactionHash,
              userAddress: userAddress,
              timestamp: currentTime,
              tokenId: tokenId,
            };

            await userHistoryModel.create(mainData);

            // await userDataModel.findOneAndUpdate(
            //   { userAddress: userAddress },
            //   {
            //     $push: {
            //       StakedTokens: tokenId,
            //       StakedTokenDetails: {
            //         stakedTokenId: tokenId,
            //         txnHash: log.transactionHash,
            //         timestamp: currentTime,
            //       },
            //     },
            //   }

            await userDataModel.findOneAndUpdate(
              { userAddress: userAddress },
              {
                $push: {
                  StakedTokens: tokenId,
                  StakedTokenDetails: {
                    stakedTokenId: tokenId,
                    txnHash: log.transactionHash,
                    timestamp: currentTime,
                  },
                },
              },
              {
                upsert: true,
              }
            );

            console.log("Added to User Data Collection");
          }
        })
        .on("changed", function (log: any) {});

      console.log("FINALLY DONE BRO --------------------");
    } catch (error) {
      console.error(error);
    }
  };

  public getNFPMevents = async () => {
    try {
      const block: any = await blockInfoModel.findOne({
        address: Config.NFPM_ADDRESS,
      });
      console.log("blockNumber", block?.blockNumber || Config.NFPM_ADDRESS);

      const NFPM_ABI: any = Config.NFPM_ABI;
      const NFPMcontractInstance: any =
        new Config.POLYGON_WEB3INSTANCE.eth.Contract(
          NFPM_ABI,
          Config.NFPM_ADDRESS?.toString()
        );

      var subscription = this.web3Instance.eth
        .subscribe(
          "logs",
          {
            address: Config.NFPM_ADDRESS,
            topics: [
              "0x3067048beee31b25b2f1681f88dac838c8bba36af25bfb2b7cf7473a5847e35f",
            ],
            fromBlock: Config.POOL_BLOCK_NUMBER,
          },
          function (error: any, result: any) {
            if (!error) console.log(result);
          }
        )
        .on("connected", function (subscriptionId: any) {
          console.log(subscriptionId);
        })
        .on("data", function (log: any) {
          console.log("IN NFPM SUBSCRIBE");

          console.log(log);
        })
        .on("changed", function (log: any) {});

      // unsubscribes the subscription
      subscription.unsubscribe(function (error: any, success: any) {
        if (success) console.log("Successfully unsubscribed!");
      });
      // const result: any = await NFPMcontractInstance.getPastEvents(
      //   "IncreaseLiquidity",
      //   {
      //     // id: "log_040ed390",
      //     fromBlock: block?.blockNumber || Config.STAKER_BLOCK_NUMBER,
      //     toBlock: "latest",
      //   }
      // );

      // console.log(
      //   await this.web3Instance.utils.hexToNumberString("0x0000000000d89d0d00")
      // );

      // for (let i = 0; i < result.length; i++) {
      //   // if(result[i]) {
      //   // console.log(result[i].returnValues.tokenId);
      //   const tokenId = Number(result[i].returnValues.tokenId);

      //   // const positions: any = await NFPMcontractInstance.methods
      //   //   .positions(tokenId)
      //   //   .call();

      //   // // console.log("----------------", positions);

      //   // if (
      //   //   positions[2] == "0xd9D66D8e0c25E7D8a2B1361d78aDc34B9dF3D5d3" &&
      //   //   positions[3] == "0xE47c3e485d02D8c607e767b1535dB9a831bdF518" &&
      //   //   positions[4] == "3000"
      //   // ) {
      //   //   console.log("IN HERE");

      //   //   await NFPMeventModels.create({
      //   //     txnHash: result[i].transactionHash,
      //   //     userAddress: result[i].returnValues.user.toString().toLowerCase(),
      //   //     timestamp: result[i].returnValues.currentTime,
      //   //     tokenId: result[i].returnValues.tokenId,
      //   //   });
      //   // }

      //   // }

      //   // if(result[i].returnValues)
      // }

      // console.log("IncreaseLiquidity------------->", result);

      console.log("NFPM Events");

      // let subscription = this.web3Instance.eth
      //   .subscribe("logs", {
      //     fromBlock: 43039000,
      //     toBlock: 43040000,
      //     address: Config.STAKER_ADDRESS,
      //   })
      //   .on("connected", function (subscriptionId: any) {
      //     console.log("subscriptionId", subscriptionId);
      //   })
      //   .on("data", async (log: any) => {
      //   console.log("----------------NFPM----------------", log);

      //   })
      //   .on("changed", function (log: any) {});
    } catch (error) {
      console.log(error);
    }
  };
}

export default new UserEvents();

