import fs from "fs";
import path from "path";
import { BASE_NETWORK_PATH ,CONNECTION_PROFILE_PATH } from "../paths.js";


const BASE_PATH = BASE_NETWORK_PATH;
const OUTPUT_PATH = CONNECTION_PROFILE_PATH;

const profile = {
  name: "fabric-network",
  version: "1.0.0",
  client: {
    organization: "Org1",
    connection: {
      timeout: {
        peer: { endorser: "300" },
        orderer: "300"
      }
    }
  },
  organizations: {},
  orderers: {},
  peers: {},
  certificateAuthorities: {}
};

function addOrg(orgName, orgDomain, port, caPort) {
  const orgMSP = `${orgName}MSP`;
  const peerHost = `peer0.${orgDomain}`;
  const peerTLS = path.join(BASE_PATH, "peerOrganizations", orgDomain, "peers", peerHost, "tls", "ca.crt");
  const caCert = path.join(BASE_PATH, "peerOrganizations", orgDomain, "ca", `ca.${orgDomain}-cert.pem`);

  profile.organizations[orgName] = {
    mspid: orgMSP,
    peers: [peerHost],
    certificateAuthorities: [`ca.${orgDomain}`]
  };

  profile.peers[peerHost] = {
    url: `grpcs://localhost:${port}`,
    tlsCACerts: { path: peerTLS },
    grpcOptions: {
      "ssl-target-name-override": peerHost,
      "hostnameOverride": peerHost
    }
  };

  profile.certificateAuthorities[`ca.${orgDomain}`] = {
    url: `https://localhost:${caPort}`,
    caName: `ca-${orgName.toLowerCase()}`,
    tlsCACerts: { path: caCert },
    httpOptions: {
      verify: false
    }
  };
}

function addOrderer() {
  const ordererHost = "orderer.example.com";
  const ordererTLS = path.join(BASE_PATH, "ordererOrganizations", "example.com", "orderers", ordererHost, "tls", "ca.crt");

  profile.organizations["OrdererOrg"] = {
    mspid: "OrdererMSP",
    orderers: [ordererHost]
  };

  profile.orderers[ordererHost] = {
    url: "grpcs://localhost:7050",
    tlsCACerts: { path: ordererTLS },
    grpcOptions: {
      "ssl-target-name-override": ordererHost,
      "hostnameOverride": ordererHost
    }
  };
}

addOrg("Org1", "org1.example.com", 7051, 7054);
addOrg("Org2", "org2.example.com", 9051, 8054);
addOrderer();

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(profile, null, 2));
console.log(`✅ Connection profile written to ${OUTPUT_PATH}`);
