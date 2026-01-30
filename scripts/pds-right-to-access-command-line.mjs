//const { BskyAgent } = require('@atproto/api')

import { AtpAgent } from '../packages/api/dist/index.js'
import {readCar, cborToLexRecord} from '../packages/repo/dist/index.js'
import { Secp256k1Keypair } from '../packages/crypto/dist/index.js'
//import {prompt} from "prompt-sync"

import fs from "fs";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Writable } from "node:stream";

import process from 'node:process';

const args = process.argv.slice(2);

const getArg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : undefined;
};

const PDS_URL = getArg('pds_url');
const HANDLE = getArg('handle');
const PASSWORD = getArg('password');

if (!PDS_URL || !HANDLE || !PASSWORD) {
  console.error('Usage: node your-file.mjs --pds_url <url> --handle <handle> --password <password>');
  process.exit(1);
}

console.log({ PDS_URL, HANDLE, PASSWORD });


const currAgent = new AtpAgent({ service: PDS_URL })

await currAgent.login({
    identifier: HANDLE,
    password: PASSWORD,
  })

const accountDid = currAgent.session?.did

console.log("GETDID")
console.log(accountDid)

var toReturnDict = {}

console.log("BEGIN GATHERING RECORDS")

const repoRes = await currAgent.com.atproto.sync.getRepo({ did: accountDid })

console.log(repoRes)

console.log(Object.keys(repoRes))

console.log(repoRes['data'])

const carFileRead = await readCar(repoRes['data'])

console.log(Object.keys(carFileRead))

console.log('roots',carFileRead['roots'])

console.log('blocks',carFileRead['blocks'])

var currBlocks = carFileRead['blocks']

var allRecords = []

for (var [key, value] of currBlocks.map) {

	var carFileCurr = await cborToLexRecord(value)

	console.log(key)
	//console.log(carFileCurr)

	var keysList = Object.keys(carFileCurr)

	const typeString = '$type'

	if (keysList.includes(typeString)) {
		console.log(carFileCurr[typeString])
		allRecords.push(carFileCurr)
	}
}

toReturnDict['record'] = allRecords

console.log("END GATHERING RECORDS")

var allBlobs = []

let blobCursor = undefined
do {
const listedBlobs = await currAgent.com.atproto.sync.listBlobs({
  did: accountDid,
  cursor: blobCursor,
})
for (const cid of listedBlobs.data.cids) {
  const blobRes = await currAgent.com.atproto.sync.getBlob({
    did: accountDid,
    cid,
  })
}
blobCursor = listedBlobs.data.cursor
console.log(listedBlobs.data)
console.log(blobCursor)
allBlobs.push(listedBlobs.data)
} while (blobCursor)


toReturnDict['blobs'] = allBlobs

const prefs = await currAgent.getPreferences()

console.log(Object.keys(prefs))


var currPrefKeys = Object.keys(prefs)

for (var i = 0; i < currPrefKeys.length; i++) {
	console.log(currPrefKeys[i], prefs[currPrefKeys[i]])
}



toReturnDict['preferences'] = prefs


let objectLength = 0;
for (let key in toReturnDict) {
    objectLength++;
 }
 console.log(objectLength)

var filename = 'data-downloaded/public-data/pds_gdpr_request_DID_handle_' + HANDLE + '.json'

console.log(filename)

fs.writeFile(filename, JSON.stringify(toReturnDict), function(err) {
    if (err) {
        console.log(errorMessage);
        console.log(err);
      }
    });

console.log("END ")






































