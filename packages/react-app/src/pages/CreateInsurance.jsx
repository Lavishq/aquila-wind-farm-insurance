import Address from "../components/Address";
import Balance from "../components/Balance";
import { Card, Button, Form, Input } from "antd";
import React from "react";
import { useState } from "react";
import { Transactor } from "../helpers";
import deployedContracts from "../contracts/hardhat_contracts.json";
const { ethers } = require("ethers");

export default function CreateInsurance({
  name,
  address,
  writeContracts,
  gasPrice,
  signer,
  provider,
  blockExplorer,
  localChainId,
  contractConfig,
  price,
}) {
  const abiContract = deployedContracts[5].goerli.contracts.TurbineInsuranceFactoryPolicy.abi;

  const onFinish = values => {
    console.log("Success:", values);
  };
  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
  const oracleAddress = "0xB9756312523826A566e222a34793E414A81c88E1";
  const [client, setClient] = useState("0xBeA5dD2179E81C115b2008A8F89807Df66f3251c");
  const [amount, setAmount] = useState("1"); // just 1 wei
  const [month, setMonth] = useState("1");
  const [lat, setLat] = useState("28.613939"); // 28.613939
  const [lon, setLon] = useState("97.209021"); // 97.209021

  function clientHandler(event) {
    setClient(event.target.value);
  }
  function amountHandler(event) {
    setAmount(event.target.value);
  }
  function monthHandler(event) {
    setMonth(event.target.value);
  }
  function latHandler(event) {
    setLat(event.target.value);
  }
  function lonHandler(event) {
    setLon(event.target.value);
  }

  const tx = Transactor(signer, gasPrice);

  const createNewInsurace = async () => {
    console.log(writeContracts[0]);
    await tx(
      writeContracts.TurbineInsuranceFactoryPolicy.createNewPolicy(amount, client, month, lat, lon, {
        value: amount,
        gasLimit: 200000,
      }),
    );
  };

  return (
    <div style={{ margin: "auto", width: "70vw" }}>
      <h1 style={{ margin: "1rem", fontFamily: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace' }}>
        Create New Insurance Policy
      </h1>
      <Card
        title={
          <div style={{ fontSize: 20 }}>
            {"TurbineInsuranceFactoryPolicy"} Contract
            <div style={{ float: "right" }}>
              <Address value={address} blockExplorer={blockExplorer} />
              <Balance address={address} provider={provider} price={price} />
            </div>
          </div>
        }
        size="large"
        style={{ marginTop: 25, width: "100%" }}
      >
        <Form
          name="basic"
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: false }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item label="Link">
            <Address value={linkAddress} blockExplorer={blockExplorer} />
          </Form.Item>
          <Form.Item label="Oracle">
            <Address value={oracleAddress} blockExplorer={blockExplorer} />
          </Form.Item>
        </Form>
        <Form
          name="basic"
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: false }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="Client"
            name="clientAddress"
            rules={[{ required: true, message: "Please input Client Address" }, { whitespace: true }]}
          >
            <Input placeholder="address" onChange={clientHandler} />
          </Form.Item>
          <Form.Item label="Amount" name="amount" rules={[{ required: true, message: "Please input Amount in ETH" }]}>
            <Input placeholder="Amount in ETH (wei)" onChange={amountHandler} />
          </Form.Item>
          <Form.Item label="Months" name="month" rules={[{ required: true, message: "Please input Insurance Months" }]}>
            <Input placeholder="5" onChange={monthHandler} />
          </Form.Item>
          <Form.Item label="Latitudes" name="lat" rules={[{ required: true, message: "Please input Latitudes" }]}>
            <Input placeholder="28.613939" onChange={latHandler} />
          </Form.Item>
          <Form.Item
            label="Longitudes"
            name="lon"
            rules={[{ required: true, message: "Please input your Longitudes" }]}
          >
            <Input placeholder="97.209021" onChange={lonHandler} />
          </Form.Item>
          <Button onClick={createNewInsurace} type="primary" htmlType="submit">
            Submit
          </Button>
        </Form>
      </Card>
    </div>
  );
}
