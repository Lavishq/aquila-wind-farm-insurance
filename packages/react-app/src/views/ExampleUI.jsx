import { Link } from "react-router-dom";

export default function ExampleUI({}) {
  return (
    <div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 600, margin: "auto", marginTop: 25 }}>
        <h2>
          <strong>How does this work?</strong>
        </h2>
        <h4 style={{ padding: 14 }}>
          The Insurer interacts with the FactoryContract i.e. TurbineInsuranceFactoryPolicy (contract) and creates a
          policy. When creating the policy the the FactoryContract creates another contract i.e. TurbineInsure
          (contract) which stores all the state of the contract like windSpeed, amount, client, insurer, months the
          contract is insured as well as exact location in the form of latitudes and longitudes.
        </h4>
        <h4 style={{ padding: 14 }}>
          And If the client sees that the windSpeed is slow through whatever source he used to aquire the information
          then he can call the updateState function of the contract using the frontend which triggers the decentralised
          api call of Accuweather DataFeed Provider and state changes but every call costs 0.1 LINK token (from the
          insurance contract) . So it is important to make sure if the InsuraceContract has link.
        </h4>
        <h3>
          <strong> Technical explanation of InsuranceContract payout function</strong>
        </h3>
        <h4 style={{ padding: 14 }}>
          A function compares between two timestamps and if the windSpeed was below 15 mph for 6 hours and the api was
          called more than 4 times ( i.e. 5 times ) as well as a boolean value of contract is true then the payout
          function is triggers. Else if the windSpeed increases above 15 mph even once and then it was called so the
          boolean value is changed to false and there is no payout.
        </h4>
      </div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 600, margin: "auto", marginTop: 25 }}>
        <h2>
          <strong>How to interact our dapp?</strong>
        </h2>
        <h4>
          <ins>
            <strong>note</strong>: important fucntions explained are in{" "}
            <em>
              <strong>bold</strong>
            </em>
            and
            <em>
              <strong>write contracts</strong>
            </em>{" "}
            is in <em>italic as well as bold</em> and{" "}
            <em>
              <strong>read contract</strong>
            </em>{" "}
            is in{" "}
            <strong>
              <em>italic</em>
            </strong>
          </ins>
        </h4>
        <h3>
          <strong>
            The interaction is at <strong>Insurance Factory</strong> through Navbar
          </strong>
        </h3>
        <h4 style={{ padding: 14 }}>
          <em>
            <ins>clientOwnership</ins>
          </em>{" "}
          mapping takes address of a client and uint256 to return the InsuranceContract{" "}
        </h4>
        <h4 style={{ padding: 14 }}>
          <em>
            <ins>insurerOwnership</ins>
          </em>{" "}
          mapping takes address of a insurer and uint256 to return the InsuranceContract{" "}
        </h4>
        <h4 style={{ padding: 14 }}>
          <strong>
            <ins>createNewPolicy</ins>
          </strong>{" "}
          creates a new Insurance which takes amount, clientAddress, months the contract is supposed to be insured as
          well as exact location in the form of lat (latitudes) and lon (longitudes). msg.sender is insurer, please make
          sure to enter the amount in transaction value as well{" "}
          <strong>
            Alternative you can go to <Link to={"/create-insurance"}>Create Insurance</Link>
          </strong>
        </h4>
        <h4 style={{ padding: 14 }}>
          <em>
            <ins>getClientPolicies</ins>
          </em>{" "}
          will display all the insurances (contract) that you bought
        </h4>
        <h4 style={{ padding: 14 }}>
          <em>
            <ins>getInsurerPolicies</ins>
          </em>{" "}
          will display all the insurances (contract) that you created for your client, if any{" "}
        </h4>
        <h4 style={{ padding: 14 }}>
          <em>
            <ins>getInsurancePolicies</ins>
          </em>{" "}
          will display all the insurances displayed using FactoryContract i.e. TurbineInsuranceFactoryPolicy (contract){" "}
        </h4>
        <h4 style={{ padding: 14 }}>
          <em>
            <ins>insurancePolicies</ins>
          </em>{" "}
          mapping takes uint256 and return the contract mapped at that uint256{" "}
        </h4>
        <h4 style={{ padding: 14 }}>
          <strong>
            <ins>updateStateOfAllContracts</ins>
          </strong>{" "}
          updates all the insurances state ( variables like timestamps, windSpeed, etc) by calling updateState to all
          the insurances
        </h4>
      </div>
    </div>
  );
}
{
  /* <a
  href="https://github.com/austintgriffith/scaffold-eth/tree/master/packages/react-app/src/components"
  target="_blank"
  rel="noopener noreferrer"
>
  📦 components
</a> */
}
