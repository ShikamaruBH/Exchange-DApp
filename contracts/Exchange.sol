//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './Token.sol';

contract Exchange {
    address public owner;
    address public feeAccount;
    uint public feePercent;
    uint public ordersCount = 0;

    mapping(address => mapping(address => uint)) public balanceOf;
    mapping(uint => _Order) public orders;
    mapping(uint => bool) public orderCancelled;
    mapping(uint => bool) public orderFilled;

    struct _Order {
        uint id;
        address user;
        address tokenGet;
        uint amountGet;
        address tokenGive;
        uint amountGive;
        uint timestamp;
    }

    event Order (
        uint id,
        address user,
        address tokenGet,
        uint amountGet,
        address tokenGive,
        uint amountGive,
        uint timestamp
    );

    event Cancel (
        uint id,
        address user,
        address tokenGet,
        uint amountGet,
        address tokenGive,
        uint amountGive,
        uint timestamp
    );

    event Deposit(
        address token,
        address user,
        uint amount,
        uint balance
    );

    event Withdraw(
        address token,
        address user,
        uint amount,
        uint balance
    );

    event Trade (
        uint id,
        address user,
        address tokenGet,
        uint amountGet,
        address tokenGive,
        uint amountGive,
        address creator,
        uint timestamp
    );

    constructor(address _freeAccount, uint _feePercent) {
        feeAccount = _freeAccount;
        feePercent = _feePercent;
        owner = msg.sender;
    }

    function depositToken(address _token, uint _amount) public {
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        balanceOf[_token][msg.sender] += _amount;
        emit Deposit(_token, msg.sender, _amount, balanceOf[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint _amount) public {
        require(balanceOf[_token][msg.sender] >= _amount, 'Insufficient balance');
        Token(_token).transfer(msg.sender, _amount);
        balanceOf[_token][msg.sender] -= _amount;
        emit Withdraw(_token, msg.sender, _amount, balanceOf[_token][msg.sender]);
    }

    function makeOrder(address _tokenGet, uint _amountGet, address _tokenGive, uint _amountGive) public {
        require(balanceOf[_tokenGive][msg.sender] >= _amountGive, 'Insufficient token balance');
        ordersCount++;
        orders[ordersCount] = _Order(
            ordersCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
        emit Order(ordersCount,msg.sender,_tokenGet,_amountGet,_tokenGive,_amountGive,block.timestamp);
    }

    function cancelOrder(uint _id) public {
        require(_id > 0 && _id <= ordersCount, 'Invalid order id');
        require(orderCancelled[_id] != true, 'Can not cancel cancelled order');
        require(orderFilled[_id] != true, 'Can not cancel filled order');
        _Order storage order = orders[_id];
        require(msg.sender == order.user, 'Can not cancel order not belong to you');
        orderCancelled[_id] = true;
        emit Cancel(_id,order.user,order.tokenGet,order.amountGet,order.tokenGive,order.amountGive,order.timestamp);
    }

    function fillOrder(uint _id) public {
        require(_id > 0 && _id <= ordersCount, 'Invalid order id');
        require(orderCancelled[_id] != true, 'Can not fill cancelled order');
        _Order storage order = orders[_id];
        _trade(
            order.id,
            order.user,
            order.tokenGet,
            order.amountGet,
            order.tokenGive,
            order.amountGive
        );
        orderFilled[_id] = true;
    }

    function _trade(uint id, address user, address tokenGet, uint amountGet, address tokenGive, uint amountGive) internal {
        uint fee = amountGet / 100 * feePercent;
        require(balanceOf[tokenGet][msg.sender] >= amountGet + fee, 'Insufficient token balances for fee');
        balanceOf[tokenGet][msg.sender] -= amountGet + fee;
        balanceOf[tokenGet][user] += amountGet;
        balanceOf[tokenGet][feeAccount] += fee;
        balanceOf[tokenGive][msg.sender] += amountGive;
        balanceOf[tokenGive][user] -= amountGive;
        emit Trade(id, msg.sender, tokenGet, amountGet, tokenGive, amountGive, user, block.timestamp);
    }

    function changeFeePercent(uint _value) public onlyOwner {
        feePercent = _value;
    }

    modifier onlyOwner {
        require(msg.sender == owner, 'Only owner can call this method');
        _;
    }
}