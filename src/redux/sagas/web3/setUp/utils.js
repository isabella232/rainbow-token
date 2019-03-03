// Libs
import Web3 from 'web3';
import { put, call, select, all } from 'redux-saga/effects';

// Actions
import {
  setEth,
  fillNetwork,
} from '../../../actions/web3/setUp';
import {
  updateAccount,
  setDefaultAccount,
} from '../../../actions/web3/accounts';

// Utils
import {
  createContract
} from '../contracts';
import {
  getBalance
} from '../accounts';

// Configs
import web3Config from '../../../../web3Config'

export function* handleProvider(provider = undefined) {
  // Get the provider from args or from window
  const web3Provider = provider || Web3.givenProvider || web3Config.defaultProvider;
  // If no provider, throw
  if (!web3Provider)
    throw new Error('Unable to detect a provider.')
  // If provider is MetaMask, ask for permission and plug the defaultProvider
  // if there is one
  let defaultEth;
  if (web3Provider.isMetaMask) {
    yield call([web3Provider, 'enable']);
    const defaultWeb3 = web3Config.defaultProvider
    ? new Web3(web3Config.defaultProvider)
    : { eth: {} };
    defaultEth = defaultWeb3.eth;
  }
  const { eth, utils } = new Web3(web3Provider);
  if (!defaultEth) {
    defaultEth = eth;
  }
  // Get network id
  const networkId = yield call([eth.net, 'getId']);
  // Set in store
  yield put(setEth({
    ...eth,
    utils,
    subscribe: defaultEth.subscribe,
    Contract: defaultEth.Contract,
    getTransactionReceipt: defaultEth.getTransactionReceipt,
    ContractMetamask: web3Provider.isMetaMask ? eth.Contract : null
  }))
  yield put(fillNetwork({ id: networkId, isMetaMask: !!web3Provider.isMetaMask }));
}

export function* handleAccount() {
  const { getAccounts } = yield select(
    state => state.web3.eth
  );
  // Get addresses
  const addresses = yield call(getAccounts);
  // Fetch associated balances and set it in ether
  const balances = (yield all(
    addresses.map(
      address => call(getBalance, address)
    )
  ))
  // Add every accounts in the store
  yield all(
    addresses.map(
      (address, index) => put(updateAccount(
        address,
        balances[index]
      ))
    )
  )
  // Set the default account to the first one
  yield put(setDefaultAccount(addresses[0]));
}

export function* handleContract() {
  // Add every contract in the web3Config
  const { contracts } = web3Config;
  yield all(
    contracts.map(
      ({ name, abi, address, options }) => call(createContract, name, abi, address, options)
    )
  )
}