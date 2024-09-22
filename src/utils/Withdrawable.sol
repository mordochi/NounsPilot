// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Withdrawable is Ownable {
    using SafeERC20 for IERC20;

    error FailedToWithdrawEth(address owner, address target, uint256 value);

    constructor() Ownable(msg.sender) {}

    function withdraw(address beneficiary, uint256 amount) public onlyOwner {
        (bool sent, ) = beneficiary.call{value: amount}("");
        if (!sent) revert FailedToWithdrawEth(msg.sender, beneficiary, amount);
    }

    function withdrawToken(
        address beneficiary,
        address token,
        uint256 amount
    ) public onlyOwner {
        IERC20(token).safeTransfer(beneficiary, amount);
    }
}
