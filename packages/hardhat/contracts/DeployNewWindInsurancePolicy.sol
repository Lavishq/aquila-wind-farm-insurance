// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./InsureWind.sol";

contract DeployNewWindInsurancePolicy {
    address[] public insurancePolicies;
    mapping(address => address[]) public insurerOwnership;
    mapping(address => address[]) public clientOwnership;

    function createNewPolicy(
        address _link,
        address _oracle,
        uint256 _amount,
        address _client,
        uint256 months,
        string memory _lat,
        string memory _lon
    ) external payable {
        InsureWind insurewind = (new InsureWind){value: _amount}(
            _link,
            _oracle,
            _amount,
            _client,
            msg.sender,
            months,
            _lat,
            _lon
        );
        address insurancePolicyAddress = address(insurewind);
        insurancePolicies.push(insurancePolicyAddress);
        insurerOwnership[msg.sender].push(insurancePolicyAddress);
        clientOwnership[_client].push(insurancePolicyAddress);
    }

    function getInsurancePolicies() public view returns (address[] memory) {
        return insurancePolicies;
    }

    function updateStateOfAllContracts() external {
        for (uint256 i = 0; i < insurancePolicies.length; i++) {
            InsureWind insurancePolicy = InsureWind(insurancePolicies[i]);
            insurancePolicy.updatestate();
        }
    }

    function getInsurerPolicies() public view returns (address[] memory) {
        return insurerOwnership[msg.sender];
    }

    function getClientPolicies() public view returns (address[] memory) {
        return clientOwnership[msg.sender];
    }
}
