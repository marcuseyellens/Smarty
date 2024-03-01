import Web3 from 'web3';
import getConfig from 'next/config';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

let web3;
// Browser environment with Metamask installed
if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
  web3 = new Web3(window.web3.currentProvider);

  // Server environment or Metamask not installed
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(publicRuntimeConfig.infuraUrl));
}

export default web3;
