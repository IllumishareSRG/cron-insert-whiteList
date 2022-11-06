import { ethers } from "ethers";
import { Orbis } from "@orbisclub/orbis-sdk";
import "dotenv/config";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const goldListABI = require("./goldListInterface.json") // use the require method




const provider = new ethers.providers.JsonRpcProvider(

  `https://polygon-mumbai.g.alchemy.com/v2/${process.env['ALCHEMY_API_KEY']}`
);


const signer = new ethers.Wallet(process.env['PK']);


const connectedSigner = signer.connect(provider);

const orbis = new Orbis();

const GoldListContract = new ethers.Contract(process.env['CONTRACT_ADDRESS'], goldListABI, connectedSigner);

export async function insertWhiteList(req, res) {
  try {

    // Api test


    console.log(`Geting data from ${process.env.DID}`);
    const profile = await orbis.getProfile(process.env.DID);
    let data = profile.data.details.profile.data;
    console.log(data)
    let newAddresses = Object.keys(data);

    newAddresses = newAddresses.map((address) => address.toLowerCase())


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
    res.status(200).send("Sucessfull");

  } catch (error) {
    res.status(500).send(error.message);
  }
}

