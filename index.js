import { ethers } from "ethers";
import { Orbis } from "@orbisclub/orbis-sdk";
import fetch from 'node-fetch';
import crypto from 'crypto'
import "dotenv/config";

import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const goldListABI = require("./goldListInterface.json") // use the require method




const provider = new ethers.providers.JsonRpcProvider(

  process.env.ALCHEMY_API_KEY ?
    `https://polygon-mumbai.g.alchemy.com/v2/${process.env['ALCHEMY_API_KEY']}` :
    `https://rpc-mumbai.maticvigil.com`
);


const signer = new ethers.Wallet(process.env['PK']);

const connectedSigner = signer.connect(provider);

const orbis = new Orbis();

const GoldListContract = new ethers.Contract(process.env['CONTRACT_ADDRESS'], goldListABI, connectedSigner);

const apiPrivateKey = process.env.VERIFF_PRIV_KEY;

// export async function main() {
export async function insertWhiteList(req, res) {
  try {

    // Api test


    console.log(`Geting data from DID KYC ${process.env.DID}`);
    const profile = await orbis.getProfile(process.env.DID);
    let data = profile.data.details.profile.data;
    if (!data) {
      return
    }
    let newAddresses = Object.keys(data);

    newAddresses = newAddresses.map((address) => address.toLowerCase())


    newAddresses = [...new Set(newAddresses)]
    //
    let actualWhiteList = await GoldListContract.getGoldMembers();

    actualWhiteList = actualWhiteList.map((address) => address.toLowerCase());

    // check uniques and make it a Set
    const actualWhiteLisUnique = new Set([...new Set(actualWhiteList)]);

    console.log(actualWhiteLisUnique);

    const addressesToInsert = []

    for (const address of newAddresses) {
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
          "X-AUTH-CLIENT": process.env.VERIFF_PUB_KEY
        }
      };

      const result = await fetch(`https://stationapi.veriff.com/v1/sessions/${payloadAsString}/decision`, requestOptions)
      const obj = JSON.parse(await result.text());
      if (obj.verification?.status === "approved" && !actualWhiteList.includes(address)) {
        addressesToInsert.push(address);
      }
    }

    console.log("KYC Addresses to insert", addressesToInsert);


    // Getting addresses that did not require KYC because they are on the GOLD list event 



    console.log(`Geting data from DID QR ${process.env.DID_QR}`);
    const profileQR = await orbis.getProfile(process.env.DID_QR);
    let dataQR = profileQR.data.details.profile.data;
    console.log("QR Addresses to insert", dataQR);

    if (!dataQR) {
      return
    }

    newAddresses = Object.keys(dataQR);
    //Filter out addresse that are already whitelisted
    newAddresses = newAddresses.filter((address => {
      return !actualWhiteLisUnique.has(address);

    }))


    addressesToInsert.push(...newAddresses);


    console.log("Full list Addresses to Insert", addressesToInsert);

    const trueList = addressesToInsert.map(address => true);


    if (addressesToInsert.length != 0) {
      const tx = await GoldListContract.addBatchGoldList(addressesToInsert, trueList);
    }

    res.status(200).send("Sucessfull");

  } catch (error) {
    console.log(error)
    res.status(500).send(error.message);
  }
}

// main()
