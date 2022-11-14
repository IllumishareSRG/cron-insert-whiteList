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
    console.log("Addresses read from KYC DID", data)
    if (!data) {
      return
    }
    let newAddresses = Object.keys(data);

    newAddresses = newAddresses.map((address) => address.toLowerCase())


    newAddresses = [...new Set(newAddresses)]
    console.log(newAddresses)
    //
    let actualWhiteListPolygon = await GoldListContractPolygon.getGoldMembers();
    let actualWhiteListETH = await GoldListContractETH.getGoldMembers();
    let actualWhiteListBSC = await GoldListContractBSC.getGoldMembers();


    actualWhiteListPolygon = actualWhiteListPolygon.map((address) => address.toLowerCase());
    actualWhiteListETH = actualWhiteListETH.map((address) => address.toLowerCase());
    actualWhiteListBSC = actualWhiteListBSC.map((address) => address.toLowerCase());

    // check uniques and make it a Set
    const actualWhiteLisUniquePolygon = new Set([...new Set(actualWhiteListPolygon)]);
    const actualWhiteLisUniqueETH = new Set([...new Set(actualWhiteListETH)]);
    const actualWhiteLisUniqueBSC = new Set([...new Set(actualWhiteListBSC)]);



    console.log("Actual list in polygon", actualWhiteLisUniquePolygon);
    console.log("Actual list in ETH", actualWhiteLisUniqueETH);
    console.log("Actual list in BSC", actualWhiteLisUniqueBSC);

    const addressesToInsertPolygon = []
    const addressesToInsertETH = []
    const addressesToInsertBSC = []

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

      if (obj.verification?.status === "approved") {
        if (!actualWhiteListPolygon.includes(address)) {
          addressesToInsertPolygon.push(address);
        }
        if (!actualWhiteListETH.includes(address)) {
          addressesToInsertETH.push(address);
        }
        if (!actualWhiteListBSC.includes(address)) {
          addressesToInsertBSC.push(address);
        }
      }
    }

    console.log(`Geting data from QR DID ${process.env.DID_QR}`);
    const profileQR = await orbis.getProfile(process.env.DID_QR);
    let dataQR = profileQR.data.details.profile.data;
    console.log(" Addresses read from QR DID", dataQR);

    if (!dataQR) {
      return
    }

    newAddresses = Object.keys(dataQR);
    //Filter out addresse that are already whitelisted
    const newAddressesPolygon = newAddresses.filter((address => {
      return !actualWhiteLisUniquePolygon.has(address);

    }))

    const newAddressesETH = newAddresses.filter((address => {
      return !actualWhiteLisUniqueETH.has(address);

    }))


    const newAddressesBSC = newAddresses.filter((address => {
      return !actualWhiteLisUniqueBSC.has(address);

    }))


    addressesToInsertPolygon.push(...newAddressesPolygon);
    addressesToInsertETH.push(...newAddressesETH);
    addressesToInsertBSC.push(...newAddressesBSC);



    console.log("Addresses to Insert Polygon", addressesToInsertPolygon);
    console.log("Addresses to Insert ETH", addressesToInsertETH);
    console.log("Addresses to Insert BSC", addressesToInsertBSC);

    const trueListP = addressesToInsertPolygon.map(address => true);
    const trueListETH = addressesToInsertETH.map(address => true);
    const trueListBSC = addressesToInsertBSC.map(address => true);


    if (addressesToInsertPolygon.length != 0) {
      await GoldListContractPolygon.addBatchGoldList(addressesToInsert, trueListP);
    }

    if (addressesToInsertETH.length != 0) {
      await GoldListContractETH.addBatchGoldList(addressesToInsert, trueListETH);
    }


    if (addressesToInsertBSC.length != 0) {
      await GoldListContractBSC.addBatchGoldList(addressesToInsert, trueListBSC);
    }



    res.status(200).send("Sucessfull");

  } catch (error) {
    console.log(error)
    res.status(500).send(error.message);
  }
}

// main();