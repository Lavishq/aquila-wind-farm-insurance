// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "./Datetime.sol";

/**
 * @title Wine Insurance Contract for Chainlink hackathon .
 * @author supernovahs.eth harshitsinghal252@gmail.com
 * @notice This contract is deployed every time a new insurance Policy is created.
 * @dev Uses @chainlink/contracts 0.4.0.
 */

// 28.613939,77.209021
// oracle 0xfF07C97631Ff3bAb5e5e5660Cdf47AdEd8D4d4Fd
// link 0xa36085F69e2889c224210F603D836748e7dC0088

contract InsureWind is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    /* ========== CONSUMER STATE VARIABLES ========== */

    address public insurer;
    address public client;
    uint256 public duration;
    string public lat;
    string public lon;
    uint256 public premium;
    uint256 public constant DAYS_IN_SECONDS = 86400;
    uint256 startTime;
    bytes32 jobIdLocationCurrentCondition = "7c276986e23b4b1c990d8659bca7a9d0";
    uint256 paymentToOracle;
    int16 public temperatureTotal;
    DateTime public datetime;
    uint256 public amount;
    bool public active;
    uint256 public requestCount;
    bytes32 public reqId;
    bytes32 public requestIdLocationkey;
    uint8 public premiumCounter;
    uint8 public months;

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

    error Notexpired();

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

    // Maps
    mapping(bytes32 => CurrentConditionsResult)
        public requestIdCurrentConditionsResult;

    /* ========== CONSTRUCTOR ========== */

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
    ) public payable {
        require(msg.value >= _amount, "Not enough sent ");
        insurer = _insurer;
        client = _client;
        duration = _months * 30 * DAYS_IN_SECONDS;
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
        string memory metric = "metric";
        requestLocationCurrentConditions(paymentToOracle, lat, lon, metric);
    }

    /** @dev Checks that the premium payments by client are well before the month expiry, else it calls forfeiture() */
    function CheckForfeiture() external {
        uint8 counter = premiumCounter;
        uint256 currentblocktimestamp = block.timestamp;
        uint256 starttime = startTime;
        uint256 _duration = duration;
        uint256 _months = months;
        for (uint256 i = _months; i > 0; i--) {
            if (
                currentblocktimestamp > (_months * 30 * 86400) + starttime &&
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

    /* ========== CONSUMER REQUEST FUNCTIONS ========== */

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

        req.add("endpoint", "location-current-conditions"); // NB: not required if it has been hardcoded in the job spec
        req.add("lat", _lat);
        req.add("lon", _lon);
        req.add("units", _units);

        reqId = sendChainlinkRequest(req, _payment);
    }

    /* ========== CONSUMER FULFILL FUNCTIONS ========== */

    /**
     * @notice Consumes the data returned by the node job on a particular request.
     * @dev Only when `_locationFound` is true, both `_locationFound` and `_currentConditionsResult` will contain
     * meaningful data (as bytes). This function body is just an example of usage.
     * @param _requestId the request ID for fulfillment.
     * @param _locationFound true if a location was found for the given coordinates, otherwise false.
     * @param _locationResult the location information (encoded as LocationResult).
     * @param _currentConditionsResult the current weather conditions (encoded as CurrentConditionsResult).
     */
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

    /* ========== PRIVATE FUNCTIONS ========== */

    function storeCurrentConditionsResult(
        bytes32 _requestId,
        bytes memory _currentConditionsResult
    ) private {
        CurrentConditionsResult memory result = abi.decode(
            _currentConditionsResult,
            (CurrentConditionsResult)
        );
        uint256 time = result.timestamp;
        requestIdCurrentConditionsResult[_requestId] = result;

        requestCount += 1;

        if (datetime.getMonth(time) >= 3 && datetime.getMonth(time) <= 9) {
            temperatureTotal += result.temperature;
        }
        // the temperature is returned 10 times the actual , so mulitplied the limits by 10 .
        if (temperatureTotal > 27000 || temperatureTotal < 22000) {
            payoutFunction();
        }
    }

    /** @dev Transfers Policy amount to the client and rest to the insurer */
    function payoutFunction() internal ContractActive {
        payable(client).transfer(amount);
        payable(insurer).transfer(address(this).balance);
        active = false;
    }

    /** @dev Checks if insurer called the update status function everyday, except 1 day for emergency , tranfers full amount to insurer */
    /**  @dev Else tranfers double premium back to client as penalty to the  insurer*/
    function RepayInsurer() internal ContractActive {
        if (requestCount >= duration / DAYS_IN_SECONDS - 1) {
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
    function withdrawLink() public OnlyInsurer {
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
