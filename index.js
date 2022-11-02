
require('dotenv').config();

const { ethers } = require("ethers");

const goldListABI = require("./goldListInterface.json")


const provider = new ethers.providers.JsonRpcProvider(`https://polygon-mumbai.g.alchemy.com/v2/${process.env['ALCHEMY_API_KEY']}`);

const signer = new ethers.Wallet(process.env['PK']);


const connectedSigner = signer.connect(provider);

const fetch = require('node-fetch');


const GoldListContract = new ethers.Contract(process.env['CONTRACT_ADDRESS'], goldListABI, connectedSigner);


exports.insertNewWhiteList = async (req, res) => {

    try {

        // Api test

        const response = await fetch("https://mapofcrypto-cdppi36oeq-uc.a.run.app/merchantByProduct");

        const { merchantByProduct } = await response.json();

        let newAddresses = merchantByProduct.map((rc) => rc.address.toLowerCase())

        newAddresses = [...new Set(newAddresses)]

        //

        const actualWhiteList = await GoldListContract.getGoldMembers();

        actualWhiteList.map((address) => address.toLowerCase());



        // check uniques and make it a Set
        const actualWhiteLisUnique = new Set([...new Set(actualWhiteList)]);



        console.log(actualWhiteLisUnique);

        const addressesToInsert = newAddresses.filter((address => {
            return !actualWhiteLisUnique.has(address);

        }))

        console.log(addressesToInsert);

        const trueList = addressesToInsert.map(address => true);

        // console.log(trueList);


        const tx = await GoldListContract.addBatchGoldList(addressesToInsert, trueList);



        res.status(200).send("Sucessfull");

    } catch (error) {

        res.status(500).send(error.message);


    }




};
