// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "./Datetime.sol";

error Notexpired();

// 28.613939,97.209021
// operator 0xB9756312523826A566e222a34793E414A81c88E1
// link 0x326C977E6efc84E512bB9C30f76E30c160eD06FB

contract TurbineInsure is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    /* ========== STATE VARIABLES ========== */
    uint256 private constant DAYS_IN_SEC = 86400;
    address public immutable insurer;
    address public immutable client;
    uint256 public immutable amount;
    uint256 public immutable duration;
    uint256 public immutable premium;
    uint256 public months;
    bytes32 jobIdLocationCurrentCondition = "7c276986e23b4b1c990d8659bca7a9d0";
    string public lat;
    string public lon;
    uint256 private startTime;
    uint256 private paymentToOracle;
    DateTime public datetime;
    bool public active;
    uint256 public requestCount;
    uint8 public premiumCounter;

    uint16 public recentWindSpeed;
    bytes32 public recentRequestId;
    bool public requestIdUpdated;
    uint256 private constant TIME_DIFFER_SEC = 21600;
    CheckWindData public toCheckWind; // work
    uint16 public recentRequestIdCounter;

    // Checking if the contract is active or not
    modifier ContractActive() {
        require(active, "Not active");
        _;
    }

    /** @dev Modifier to check msg.sender is the oracle only */
    modifier OnlyOracle() {
        require(msg.sender == getOracleAddress(), "Only Oracle can call");
        _;
    }

    /** @dev Modifier to check msg.sender is only the insurer */
    modifier OnlyInsurer() {
        require(msg.sender == insurer, "Only insurer can call");
        _;
    }

    /** @dev Struct variables for Checking difference between 6 hour consequentive windSpeed below 15 mph*/
    struct CheckWindData {
        uint256 initWindSpeedTimestamp;
        uint256 haltWindSpeedTimestamp;
        uint8 timesChecked;
        bool recently;
    }

    /** @dev Struct for Weather data returned by the Accuweather Oracle */
    struct CurrentConditionsResult {
        uint256 timestamp;
        uint24 precipitationPast12Hours;
        uint24 precipitationPast24Hours;
        uint24 precipitationPastHour;
        uint24 pressure;
        int16 temperature;
        uint16 windDirectionDegrees;
        uint16 windSpeed;
        uint8 precipitationType;
        uint8 relativeHumidity;
        uint8 uvIndex;
        uint8 weatherIcon;
    }

    mapping(uint256 => bytes32) public uintToRequestID;
    mapping(bytes32 => CurrentConditionsResult)
        public requestIdCurrentConditionsResult;

    /**
     * @param _link the LINK token address.
     * @param _oracle the Operator.sol contract address.
     * @param _amount the amount of insurance the Policy will cover.
     * @param _client the client address.
     * @param _insurer the insurer address.
     * @param _months the No of months the policy will be active.
     * @param _lat the latitude of the location.
     * @param _lon the longitude of the location.
     */
    constructor(
        address _link,
        address _oracle,
        uint256 _amount,
        address _client,
        address _insurer,
        uint256 _months,
        string memory _lat,
        string memory _lon
    ) payable {
        require(msg.value >= _amount, "Not enough sent ");
        insurer = _insurer;
        client = _client;
        duration = _months * 30 * DAYS_IN_SEC;
        months = _months;
        lat = _lat;
        lon = _lon;
        premium = ((_amount * 5) / 1000) * _months;
        startTime = block.timestamp;
        amount = _amount;
        setChainlinkToken(_link);
        setChainlinkOracle(_oracle);
        jobIdLocationCurrentCondition = "7c276986e23b4b1c990d8659bca7a9d0";
        paymentToOracle = 100000000000000000;
        datetime = new DateTime();
        active = true;
        premiumCounter = uint8(_months);
    }

    /** @dev This function is intended to be called by the insurer everyday to record the relevant parameters for claim processing */
    function updatestate() external {
        requestIdUpdated = false;
        requestLocationCurrentConditions(paymentToOracle, lat, lon, "imperial");
    }

    /**
     * @notice Returns the current weather conditions of a location for the given coordinates.
     * @param _payment the LINK amount in Juels (i.e. 10^18 aka 1 LINK).
     * @param _lat the latitude (WGS84 standard, from -90 to 90).
     * @param _lon the longitude (WGS84 standard, from -180 to 180).
     * @param _units the measurement system ("metric" or "imperial").
     */
    function requestLocationCurrentConditions(
        uint256 _payment,
        string memory _lat,
        string memory _lon,
        string memory _units
    ) internal {
        Chainlink.Request memory req = buildChainlinkRequest(
            "7c276986e23b4b1c990d8659bca7a9d0",
            address(this),
            this.fulfillLocationCurrentConditions.selector
        );
        req.add("lat", _lat);
        req.add("lon", _lon);
        req.add("units", _units);
        recentRequestId = sendChainlinkRequest(req, _payment);
        recentRequestIdCounter++;
        uintToRequestID[recentRequestIdCounter] = recentRequestId;
    }

    /// @notice Consumes the data returned by the node job on a particular request.
    function fulfillLocationCurrentConditions(
        bytes32 _requestId,
        bool _locationFound,
        bytes memory _locationResult,
        bytes memory _currentConditionsResult
    ) public recordChainlinkFulfillment(_requestId) OnlyOracle {
        if (_locationFound) {
            storeCurrentConditionsResult(_requestId, _currentConditionsResult);
        }
    }

    function storeCurrentConditionsResult(
        bytes32 _requestId,
        bytes memory _currentConditionsResult
    ) private {
        CurrentConditionsResult memory result = abi.decode(
            _currentConditionsResult,
            (CurrentConditionsResult)
        );

        requestIdCurrentConditionsResult[_requestId] = result;

        requestCount += 1;
        recentWindSpeed = result.windSpeed;
        requestIdUpdated = true;
        checkWindSpeedStore(result.timestamp, recentWindSpeed);
    }

    /// @notice if client or insurer checks at least 5 times and the windSpeed is below 15 mph for more than 6 hours then Payout is triggered
    function checkWindSpeedStore(uint256 _timestamp, uint256 _windSpeed)
        internal
    {
        if (_windSpeed < 15) {
            toCheckWind.recently = true;
            toCheckWind.timesChecked += 1;
            toCheckWind.haltWindSpeedTimestamp = _timestamp;
            if (toCheckWind.timesChecked > 4) {
                payIfSixHourPassed();
            }
        } else {
            toCheckWind.recently = false;
            toCheckWind.timesChecked = 0;
            toCheckWind.initWindSpeedTimestamp = _timestamp;
        }
    }

    function payIfSixHourPassed() private {
        uint256 differInSpeed = toCheckWind.haltWindSpeedTimestamp -
            toCheckWind.initWindSpeedTimestamp;
        if (differInSpeed > TIME_DIFFER_SEC) {
            payoutFunction();
        }
    }

    /** @dev Transfers Policy amount to the client and rest to the insurer */
    function payoutFunction() internal ContractActive {
        payable(client).transfer(amount);
        payable(insurer).transfer(address(this).balance);
        active = false;
    }

    /** @dev Checks that the premium payments by client are well before the month expiry, else it calls forfeiture() */
    function checkForfeiture() external {
        uint8 counter = premiumCounter;
        uint256 currentblocktimestamp = block.timestamp;
        // uint256 _duration = duration;
        uint256 _months = months;
        for (uint256 i = _months; i > 0; i--) {
            if (
                currentblocktimestamp > (_months * 30 * 86400) + startTime &&
                counter > _months - i
            ) {
                forfeiture();
            }
        }
    }

    /** @dev Transfers all the balance (including premium ) to the insurer */
    function forfeiture() internal {
        payable(insurer).transfer(address(this).balance);
    }

    /** @dev Checks if insurer called the update status function everyday, except 1 day for emergency , tranfers full amount to insurer */
    /**  @dev Else tranfers double premium back to client as penalty to the  insurer*/
    function RepayInsurer() internal ContractActive {
        if (requestCount >= duration / DAYS_IN_SEC - 1) {
            payable(insurer).transfer(address(this).balance);
        } else {
            payable(client).transfer(premium * months * 2);
            payable(insurer).transfer(address(this).balance);
        }
        active = false;
    }

    function ExpiryCheck() external {
        if (block.timestamp < startTime + duration) revert Notexpired();
        RepayInsurer();
    }

    /* ========== OTHER FUNCTIONS ========== */
    function getOracleAddress() public view returns (address) {
        return chainlinkOracleAddress();
    }

    /** @dev Insurer can withdraw the link supplied to call the oracle  */
    function withdrawLink() external OnlyInsurer {
        LinkTokenInterface linkToken = LinkTokenInterface(
            chainlinkTokenAddress()
        );
        require(
            linkToken.transfer(msg.sender, linkToken.balanceOf(address(this))),
            "Unable to transfer"
        );
    }

    /** @dev Client pays premium  */
    function payPremium() external payable {
        require(msg.value == premium, "Not enough sent ");
        premiumCounter -= 1;
    }
}
