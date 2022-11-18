import { Divider } from "antd";

export default function YourInsurance() {
  return (
    <div style={{ margin: "auto", width: "70vw" }}>
      <h1 style={{ margin: "1rem", fontFamily: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace' }}>
        This is under construction
        {/* You haven't take any insurance.
          Take it from */}
      </h1>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 600, margin: "auto", marginTop: 25 }}>
        We were able test our TurbineInsure.sol (
        <a
          href="https://goerli.etherscan.io/address/0x4952c0F78e63b775FbA724B9DB0f30b0Da86c1F4#code"
          target="_blank"
          rel="noopener noreferrer"
        >
          verified contract
        </a>
        ) on Remix and it fetches properly provided it has LINK token.
      </div>
    </div>
  );
}
