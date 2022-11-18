import { GithubFilled } from "@ant-design/icons";
import { Button, Col, Divider, Menu, Row } from "antd";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  // useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";

import "./App.css";
import {
  Account,
  Contract,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
// import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import turbineContracts from "./contracts/turnbine.json";
import { getRPCPollTime, Transactor, Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC } from "./hooks";

// /// my imports
// import AllInsurance from "./pages/AllInsurance";
import CreateInsurance from "./pages/CreateInsurance";
import Home from "./pages/Home";
import YourInsurance from "./pages/YourInsurance";

const { ethers } = require("ethers");

const DEBUG = true;
const NETWORKCHECK = true;
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState("goerli");
  const location = useLocation();

  const targetNetwork = NETWORKS[selectedNetwork];
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);

  const mainnetProvider = useStaticJsonRPC(providers, localProvider);

  // Sensible pollTimes depending on the provider you are using
  const localProviderPollingTime = getRPCPollTime(localProvider);
  const mainnetProviderPollingTime = getRPCPollTime(mainnetProvider);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider, mainnetProviderPollingTime);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast", localProviderPollingTime);
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address, localProviderPollingTime);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address, mainnetProviderPollingTime);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // If you want to call a function on a new block
  // useOnBlock(mainnetProvider, () => {
  //   console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  // });

  const contractConfigTurbine = { turbineContracts: turbineContracts || {} };
  const readContractInsured = useContractLoader(localProvider, contractConfigTurbine);
  const writeContractInsured = useContractLoader(userSigner, contractConfigTurbine, localChainId);

  const allInsureContracts = useContractReader(readContracts, "TurbineInsuranceFactoryPolicy", "getInsurancePolicies", [
    address,
  ]);

  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      readContractInsured &&
      writeContractInsured &&
      allInsureContracts
    ) {
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🔐 writeContracts", writeContracts);
      console.log("📝 readContractInsured", readContractInsured);
      console.log("🔐 readContractInsured", readContractInsured);
      console.log("🔐 allInsureContracts", allInsureContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    localChainId,
    readContractInsured,
    writeContractInsured,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  // const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      {/* <AppHeader /> */}
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flex: 1 }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={"goerli"}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
            )}
            <Account
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
        </div>
      </Header>
      {yourLocalBalance.lte(ethers.BigNumber.from("0")) && (
        <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
      )}
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />

      <Menu style={{ textAlign: "center", marginTop: 20 }} selectedKeys={[location.pathname]} mode="horizontal">
        <Menu.Item key="/">
          <Link to="/">Home</Link>
        </Menu.Item>
        <Menu.Item key="/all-insurance">
          <Link to="/all-insurance">All Insurance</Link>
        </Menu.Item>
        <Menu.Item key="/create-insurance">
          <Link to="/create-insurance">Create And Read Insurance</Link>
        </Menu.Item>
        <Menu.Item key="/your-insurance">
          <Link to="/your-insurance">Your Insurance</Link>
        </Menu.Item>
        {/* <Menu.Item key="/debug">
          <Link to="/debug">Debug Contracts</Link>
        </Menu.Item> */}
      </Menu>

      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
      </Switch>

      <Switch>
        <Route exact path="/all-insurance">
          <Contract
            name="TurbineInsuranceFactoryPolicy"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
          {/* <AllInsurance
            address={address}
            name="TurbineInsuranceFactoryPolicy"
            price={price}
            signer={userSigner}
            provider={localProvider}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />  */}
        </Route>
      </Switch>

      <Switch>
        <Route exact path="/create-insurance">
          <CreateInsurance
            name="TurbineInsuranceFactoryPolicy"
            address={"0x4952c0F78e63b775FbA724B9DB0f30b0Da86c1F4"}
            writeContracts={writeContracts}
            signer={userSigner}
            provider={localProvider}
            blockExplorer={blockExplorer}
            localChainId={localChainId}
            contractConfig={contractConfig}
            price={price}
          />
          {/* <Contract
            name="TurbineInsuranceFactoryPolicy"
            price={price}
            signer={userSigner}
            provider={localProvider}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          /> */}
        </Route>
      </Switch>

      <Switch>
        <Route exact path="/your-insurance">
          <YourInsurance />
          {/* <Contract
            name="TurbineInsure"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={"0x1905eFf8845374657A57Fc7c6b076687f7F50B95"}
            blockExplorer={blockExplorer}
            contractConfig={contractConfigTurbine}
          /> */}
        </Route>
      </Switch>

      <Switch>
        <Route exact path="/debug">
          <Contract
            name="TurbineInsuranceFactoryPolicy"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
      </Switch>

      <Divider />
      <div className="site-footer" style={{ padding: "10px 20px" }}>
        <div className="footer-items" style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <p>
            <a href="https://github.com/Lavishq/aquila-wind-farm-insurance/" target="_blank" rel="noreferrer">
              <GithubFilled />
            </a>
          </p>
          <p>|</p>
          <p>
            Built with <a href="https://github.com/scaffold-eth/scaffold-eth">🏗 Scaffold-ETH</a> at Chainlink Fall 2022
            <a href="https://buidlguidl.com/" target="_blank" rel="noreferrer"></a>
          </p>
        </div>
      </div>
      <ThemeSwitch />
    </div>
  );
}

export default App;
