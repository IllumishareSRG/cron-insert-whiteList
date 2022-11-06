import { ethers } from "ethers";
import { Orbis } from "@orbisclub/orbis-sdk";
import fetch from 'node-fetch';
import "dotenv/config";
import cron from 'node-cron';





//import * as goldListABI from "./goldListInterface.json";

const goldListABI = [
    {
        "inputs": [],
        "name": "getGoldMembers",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "goldAddresses",
                "type": "address[]"
            },
            {
                "internalType": "bool[]",
                "name": "status",
                "type": "bool[]"
            }
        ],
        "name": "addBatchGoldList",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

const provider = new ethers.providers.JsonRpcProvider(
  process.env['ALCHEMY_API_KEY'] ?
  `https://polygon-mumbai.g.alchemy.com/v2/${process.env['ALCHEMY_API_KEY']}` :
  "https://rpc-mumbai.maticvigil.com"
);


const signer = new ethers.Wallet(process.env['PK']);


const connectedSigner = signer.connect(provider);

const orbis = new Orbis();

const GoldListContract = new ethers.Contract(process.env['CONTRACT_ADDRESS'], goldListABI, connectedSigner);

const main = async () => {
  try {

      // Api test


      console.log(`Geting data from ${process.env.DID}`);
      const profile = await orbis.getProfile(process.env.DID);
      let data = profile.data.details.profile.data;
      console.log(data)
      let newAddresses = Object.keys(data);

      newAddresses = [...new Set(newAddresses)]

      //

      let actualWhiteList = await GoldListContract.getGoldMembers();

      actualWhiteList = actualWhiteList.map((address) => address.toLowerCase());

      // check uniques and make it a Set
      const actualWhiteLisUnique = new Set([...new Set(actualWhiteList)]);



      console.log(actualWhiteLisUnique);

      const addressesToInsert = newAddresses.filter((address => {
          return !actualWhiteLisUnique.has(address);

      }))

      console.log("Addresses to Insert", addressesToInsert);

      const trueList = addressesToInsert.map(address => true);

      // console.log(trueList);

      if (addressesToInsert.length != 0) {
          const tx = await GoldListContract.addBatchGoldList(addressesToInsert, trueList);
      }
      console.log("Sucessfull")

  } catch (error) {
    console.log(error.message)
  }
}

cron.schedule('* * * * * * *', () => {
  console.log('running a task every minute');
  main();
});
