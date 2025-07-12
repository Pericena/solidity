// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleDEX {
    address public owner;
    IERC20 public tokenA;
    IERC20 public tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    event LiquidityAdded(uint256 amountA, uint256 amountB);
    event TokensSwapped(address indexed user, address fromToken, address toToken, uint256 amountIn, uint256 amountOut);
    event LiquidityRemoved(uint256 amountA, uint256 amountB);

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el owner puede ejecutar");
        _;
    }

    constructor(address _tokenA, address _tokenB) {
        owner = msg.sender;
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(tokenA.transferFrom(msg.sender, address(this), amountA), "Fallo TokenA");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "Fallo TokenB");

        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(amountA, amountB);
    }

    function swapAforB(uint256 amountAIn) external {
        require(tokenA.transferFrom(msg.sender, address(this), amountAIn), "Fallo en ingreso A");
        uint256 amountBOut = getAmountOut(amountAIn, reserveA, reserveB);

        require(tokenB.transfer(msg.sender, amountBOut), "Fallo en retiro B");

        reserveA += amountAIn;
        reserveB -= amountBOut;

        emit TokensSwapped(msg.sender, address(tokenA), address(tokenB), amountAIn, amountBOut);
    }

    function swapBforA(uint256 amountBIn) external {
        require(tokenB.transferFrom(msg.sender, address(this), amountBIn), "Fallo en ingreso B");
        uint256 amountAOut = getAmountOut(amountBIn, reserveB, reserveA);

        require(tokenA.transfer(msg.sender, amountAOut), "Fallo en retiro A");

        reserveB += amountBIn;
        reserveA -= amountAOut;

        emit TokensSwapped(msg.sender, address(tokenB), address(tokenA), amountBIn, amountAOut);
    }

    function removeLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA <= reserveA && amountB <= reserveB, "Exceso");

        require(tokenA.transfer(msg.sender, amountA), "Fallo TokenA");
        require(tokenB.transfer(msg.sender, amountB), "Fallo TokenB");

        reserveA -= amountA;
        reserveB -= amountB;

        emit LiquidityRemoved(amountA, amountB);
    }

    function getPrice(address _token) external view returns (uint256) {
        if (_token == address(tokenA)) {
            return (reserveB * 1e18) / reserveA;
        } else if (_token == address(tokenB)) {
            return (reserveA * 1e18) / reserveB;
        } else {
            revert("Token no soportado");
        }
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        require(reserveIn > 0 && reserveOut > 0, "Pool vacio");
        uint256 amountInWithFee = amountIn * 997; // Fee 0.3%
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        return numerator / denominator;
    }
}