import { ethers } from "ethers";
import { Orbis } from "@orbisclub/orbis-sdk";
import fetch from 'node-fetch';
import crypto from 'crypto'
import "dotenv/config";

import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 
const goldListABI = require("./goldListInterface.json") 

const signer = new ethers.Wallet(process.env.PK);
const apiPrivateKey = process.env.VERIFF_PRIV_KEY;
const orbis = new Orbis();


const providerPolygon = new ethers.providers.JsonRpcProvider(`https://polygon-mainnet.g.alchemy.com/${process.env.ALCHEMY_POLYGON_KEY}`);
const providerETH = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETH_KEY}`)
const providerBSC = new ethers.providers.JsonRpcProvider('https://bsc-dataseed3.defibit.io');



const connectedSignerPolygon = signer.connect(providerPolygon);
const connectedSignerETH = signer.connect(providerETH);
const connectedSignerBSC = signer.connect(providerBSC);


const GoldListContractPolygon = new ethers.Contract(process.env.CONTRACT_ADDRESS_POLYGON, goldListABI, connectedSignerPolygon);
const GoldListContractETH = new ethers.Contract(process.env.CONTRACT_ADDRESS_ETH, goldListABI, connectedSignerETH);
const GoldListContractBSC = new ethers.Contract(process.env.CONTRACT_ADDRESS_BSC, goldListABI, connectedSignerBSC);



// export async function main() {
export async function insertWhiteList(req, res) {
  try {

    // Api test


    console.log(`Geting data from ${process.env.DID}`);
    const profile = await orbis.getProfile(process.env.DID);
    let data = profile.data.details.profile.data;
    console.log(data)
    if(!data){
      return
    }
    let newAddresses = Object.keys(data);

    newAddresses = newAddresses.map((address) => address.toLowerCase())


    newAddresses = [...new Set(newAddresses)]
    console.log(newAddresses)
    //
    let actualWhiteList = await GoldListContractPolygon.getGoldMembers();

    actualWhiteList = actualWhiteList.map((address) => address.toLowerCase());

    // check uniques and make it a Set
    const actualWhiteLisUnique = new Set([...new Set(actualWhiteList)]);



    console.log(actualWhiteLisUnique);

    const addressesToInsert = []

    for(const address of newAddresses){
      console.log(address)
      const payloadAsString = data[address];

      const signature = crypto
        .createHmac('sha256', apiPrivateKey)
        .update(Buffer.from(payloadAsString, 'utf8'))
        .digest('hex')
        .toLowerCase();
      var requestOptions = {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'X-HMAC-SIGNATURE': signature,
              "X-AUTH-CLIENT":  process.env.VERIFF_PUB_KEY
          }
      };

      const result = await fetch(`https://stationapi.veriff.com/v1/sessions/${payloadAsString}/decision`, requestOptions)
      const obj = JSON.parse(await result.text());
      if(obj.verification?.status === "approved" && !actualWhiteList.includes(address)){
        addressesToInsert.push(address);
      }
    }


    console.log("Addresses to Insert", addressesToInsert);

    const trueList = addressesToInsert.map(address => true);


    if (addressesToInsert.length != 0) {

       await GoldListContractPolygon.addBatchGoldList(addressesToInsert, trueList);
       await GoldListContractBSC.addBatchGoldList(addressesToInsert, trueList);
       await GoldListContractETH.addBatchGoldList(addressesToInsert, trueList);

    }

    res.status(200).send("Sucessfull");

  } catch (error) {
    console.log(error)
    res.status(500).send(error.message);
  }
}

// main();