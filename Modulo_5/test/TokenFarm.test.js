const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenFarm", function () {
    let tokenFarm;
    let dappToken;
    let lpToken;
    let owner;
    let user1;
    let user2;
    let user3;

    // Helper function to advance blocks
    async function advanceBlocks(numBlocks) {
        for (let i = 0; i < numBlocks; i++) {
            await ethers.provider.send("evm_mine");
        }
    }

    // Helper function to get current block number
    async function getCurrentBlock() {
        return await ethers.provider.getBlockNumber();
    }

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2, user3] = await ethers.getSigners();

        // Deploy DappToken
        const DappToken = await ethers.getContractFactory("DAppToken");
        dappToken = await DappToken.deploy(owner.address);
        await dappToken.waitForDeployment();

        // Deploy LPToken
        const LPToken = await ethers.getContractFactory("LPToken");
        lpToken = await LPToken.deploy(owner.address);
        await lpToken.waitForDeployment();

        // Deploy TokenFarm
        const TokenFarm = await ethers.getContractFactory("TokenFarm");
        tokenFarm = await TokenFarm.deploy(await dappToken.getAddress(), await lpToken.getAddress());
        await tokenFarm.waitForDeployment();

        // Set TokenFarm as owner of DappToken for minting rewards
        await dappToken.transferOwnership(await tokenFarm.getAddress());

        // Mint LP tokens to users for testing
        const mintAmount = ethers.parseEther("1000");
        await lpToken.mint(user1.address, mintAmount);
        await lpToken.mint(user2.address, mintAmount);
        await lpToken.mint(user3.address, mintAmount);

        // Approve TokenFarm to spend LP tokens
        await lpToken.connect(user1).approve(await tokenFarm.getAddress(), mintAmount);
        await lpToken.connect(user2).approve(await tokenFarm.getAddress(), mintAmount);
        await lpToken.connect(user3).approve(await tokenFarm.getAddress(), mintAmount);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await tokenFarm.owner()).to.equal(owner.address);
        });

        it("Should set the correct token addresses", async function () {
            expect(await tokenFarm.dappToken()).to.equal(await dappToken.getAddress());
            expect(await tokenFarm.lpToken()).to.equal(await lpToken.getAddress());
        });

        it("Should have the correct name", async function () {
            expect(await tokenFarm.name()).to.equal("Proportional Token Farm");
        });

        it("Should have zero total staking balance initially", async function () {
            expect(await tokenFarm.totalStakingBalance()).to.equal(0);
        });

        it("Should have default reward per block of 1e18", async function () {
            expect(await tokenFarm.rewardPerBlock()).to.equal(ethers.parseEther("1"));
        });

        it("Should have correct reward range constants", async function () {
            const [min, max] = await tokenFarm.getRewardRange();
            expect(min).to.equal(ethers.parseEther("0.1")); // MIN_REWARD_PER_BLOCK
            expect(max).to.equal(ethers.parseEther("10"));   // MAX_REWARD_PER_BLOCK
        });

        it("Should have default fee percentage of 5%", async function () {
            const [currentFee, maxFee, accumulated] = await tokenFarm.getFeeInfo();
            expect(currentFee).to.equal(500); // 5% = 500/10000
            expect(maxFee).to.equal(1000);    // 10% = 1000/10000
            expect(accumulated).to.equal(0);  // No fees collected initially
        });
    });

    describe("Test 1: Mint LP tokens and deposit", function () {
        it("Should allow user to deposit LP tokens successfully", async function () {
            const depositAmount = ethers.parseEther("100");
            
            // Check initial LP token balance
            const initialLPBalance = await lpToken.balanceOf(user1.address);
            expect(initialLPBalance).to.equal(ethers.parseEther("1000"));

            // Perform deposit
            await expect(tokenFarm.connect(user1).deposit(depositAmount))
                .to.emit(tokenFarm, "Deposit")
                .withArgs(user1.address, depositAmount);

            // Check user info after deposit
            const userInfo = await tokenFarm.userInfo(user1.address);
            expect(userInfo.stakingBalance).to.equal(depositAmount);
            expect(userInfo.hasStaked).to.equal(true);
            expect(userInfo.isStaking).to.equal(true);
            expect(userInfo.checkpoints).to.be.gt(0); // Should have a checkpoint

            // Check total staking balance
            expect(await tokenFarm.totalStakingBalance()).to.equal(depositAmount);

            // Check LP token was transferred to contract
            const finalLPBalance = await lpToken.balanceOf(user1.address);
            expect(finalLPBalance).to.equal(initialLPBalance - depositAmount);
            
            const contractLPBalance = await lpToken.balanceOf(await tokenFarm.getAddress());
            expect(contractLPBalance).to.equal(depositAmount);
        });

        it("Should reject deposits with zero amount", async function () {
            await expect(tokenFarm.connect(user1).deposit(0))
                .to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should allow multiple deposits from same user", async function () {
            const firstDeposit = ethers.parseEther("50");
            const secondDeposit = ethers.parseEther("30");

            // First deposit
            await tokenFarm.connect(user1).deposit(firstDeposit);
            let userInfo = await tokenFarm.userInfo(user1.address);
            expect(userInfo.stakingBalance).to.equal(firstDeposit);

            // Second deposit
            await tokenFarm.connect(user1).deposit(secondDeposit);
            userInfo = await tokenFarm.userInfo(user1.address);
            expect(userInfo.stakingBalance).to.equal(firstDeposit + secondDeposit);
            expect(await tokenFarm.totalStakingBalance()).to.equal(firstDeposit + secondDeposit);
        });
    });

    describe("Test 2: Correct reward distribution", function () {
        beforeEach(async function () {
            // Set up multiple users with different staking amounts
            await tokenFarm.connect(user1).deposit(ethers.parseEther("100")); // 25% of total
            await tokenFarm.connect(user2).deposit(ethers.parseEther("300")); // 75% of total
            // Total staking: 400 LP tokens
        });

        it("Should distribute rewards proportionally to all stakers", async function () {
            // Advance 10 blocks to generate rewards
            await advanceBlocks(10);

            // Distribute rewards to all users
            await expect(tokenFarm.connect(owner).distributeRewardsAll())
                .to.emit(tokenFarm, "RewardsDistributed");

            // Check user1 rewards (should have 25% of total rewards)
            const user1Info = await tokenFarm.userInfo(user1.address);
            const expectedUser1Reward = ethers.parseEther("2.5"); // 1e18 * 10 * 0.25
            expect(user1Info.pendingRewards).to.be.closeTo(expectedUser1Reward, ethers.parseEther("0.1"));

            // Check user2 rewards (should have 75% of total rewards)
            const user2Info = await tokenFarm.userInfo(user2.address);
            const expectedUser2Reward = ethers.parseEther("7.5"); // 1e18 * 10 * 0.75
            expect(user2Info.pendingRewards).to.be.closeTo(expectedUser2Reward, ethers.parseEther("0.1"));
        });

        it("Should only allow owner to distribute rewards to all users", async function () {
            await expect(tokenFarm.connect(user1).distributeRewardsAll())
                .to.be.revertedWith("Only owner can call this function");
        });

        it("Should calculate rewards correctly over multiple periods", async function () {
            // First period: advance 5 blocks and distribute
            await advanceBlocks(5);
            await tokenFarm.connect(owner).distributeRewardsAll();

            const user1InfoFirst = await tokenFarm.userInfo(user1.address);
            const expectedFirstReward = ethers.parseEther("1.25"); // 1e18 * 5 * 0.25
            expect(user1InfoFirst.pendingRewards).to.be.closeTo(expectedFirstReward, ethers.parseEther("0.1"));

            // Second period: advance 5 more blocks and distribute again
            await advanceBlocks(5);
            await tokenFarm.connect(owner).distributeRewardsAll();

            const user1InfoSecond = await tokenFarm.userInfo(user1.address);
            const expectedTotalReward = ethers.parseEther("2.5"); // 1e18 * 10 * 0.25
            expect(user1InfoSecond.pendingRewards).to.be.closeTo(expectedTotalReward, ethers.parseEther("0.1"));
        });

        it("Should handle new users joining after initial staking", async function () {
            // Advance some blocks with initial stakers
            await advanceBlocks(5);
            await tokenFarm.connect(owner).distributeRewardsAll();

            // New user joins
            await tokenFarm.connect(user3).deposit(ethers.parseEther("100"));
            // Now total is 500: user1(100), user2(300), user3(100)

            // Advance more blocks
            await advanceBlocks(10);
            await tokenFarm.connect(owner).distributeRewardsAll();

            // Check that user3 only gets rewards for blocks after joining
            const user3Info = await tokenFarm.userInfo(user3.address);
            const expectedUser3Reward = ethers.parseEther("2.0"); // 1e18 * 10 * (100/500)
            expect(user3Info.pendingRewards).to.be.closeTo(expectedUser3Reward, ethers.parseEther("0.1"));
        });
    });

    describe("Test 3: Claim rewards functionality", function () {
        beforeEach(async function () {
            // Set up staking
            await tokenFarm.connect(user1).deposit(ethers.parseEther("100"));
            await advanceBlocks(10);
            await tokenFarm.connect(owner).distributeRewardsAll();
        });

        it("Should allow user to claim rewards successfully", async function () {
            const userInfo = await tokenFarm.userInfo(user1.address);
            const pendingRewards = userInfo.pendingRewards;
            expect(pendingRewards).to.be.gt(0);

            // Check initial DAPP token balance
            const initialDappBalance = await dappToken.balanceOf(user1.address);
            expect(initialDappBalance).to.equal(0);

            // Claim rewards
            await expect(tokenFarm.connect(user1).claimRewards())
                .to.emit(tokenFarm, "RewardsClaimed")
                .withArgs(user1.address, pendingRewards);

            // Check DAPP tokens were minted to user
            const finalDappBalance = await dappToken.balanceOf(user1.address);
            expect(finalDappBalance).to.equal(pendingRewards);

            // Check pending rewards reset to 0
            const updatedUserInfo = await tokenFarm.userInfo(user1.address);
            expect(updatedUserInfo.pendingRewards).to.equal(0);
        });

        it("Should charge fee when claiming rewards", async function () {
            const userInfo = await tokenFarm.userInfo(user1.address);
            const pendingRewards = userInfo.pendingRewards;
            expect(pendingRewards).to.be.gt(0);

            // Calculate expected fee (5% = 500/10000)
            const expectedFee = (pendingRewards * 500n) / 10000n;
            const expectedUserAmount = pendingRewards - expectedFee;

            // Claim rewards
            await expect(tokenFarm.connect(user1).claimRewards())
                .to.emit(tokenFarm, "RewardsClaimed")
                .withArgs(user1.address, expectedUserAmount, expectedFee);

            // Check user received net amount (after fee)
            const userDappBalance = await dappToken.balanceOf(user1.address);
            expect(userDappBalance).to.equal(expectedUserAmount);

            // Check fee was collected
            const [, , collectedFees] = await tokenFarm.getFeeInfo();
            expect(collectedFees).to.equal(expectedFee);
        });

        it("Should reject claim when no rewards are pending", async function () {
            // First claim all rewards
            await tokenFarm.connect(user1).claimRewards();

            // Try to claim again with no pending rewards
            await expect(tokenFarm.connect(user1).claimRewards())
                .to.be.revertedWith("No rewards to claim");
        });

        it("Should handle multiple claim cycles", async function () {
            // First claim cycle
            await tokenFarm.connect(user1).claimRewards();
            const firstClaimBalance = await dappToken.balanceOf(user1.address);

            // Generate more rewards
            await advanceBlocks(5);
            await tokenFarm.connect(owner).distributeRewardsAll();

            // Second claim cycle
            await tokenFarm.connect(user1).claimRewards();
            const secondClaimBalance = await dappToken.balanceOf(user1.address);

            expect(secondClaimBalance).to.be.gt(firstClaimBalance);
        });
    });

    describe("Test 4: Withdraw functionality and claim pending rewards", function () {
        beforeEach(async function () {
            // Set up staking with rewards
            await tokenFarm.connect(user1).deposit(ethers.parseEther("200"));
            await tokenFarm.connect(user2).deposit(ethers.parseEther("100"));
            await advanceBlocks(10);
            // Don't distribute rewards yet - they should be calculated during withdraw
        });

        it("Should allow user to withdraw all staked tokens", async function () {
            const initialLPBalance = await lpToken.balanceOf(user1.address);
            const stakingBalance = ethers.parseEther("200");

            // Withdraw
            await expect(tokenFarm.connect(user1).withdraw())
                .to.emit(tokenFarm, "Withdraw")
                .withArgs(user1.address, stakingBalance);

            // Check LP tokens returned to user
            const finalLPBalance = await lpToken.balanceOf(user1.address);
            expect(finalLPBalance).to.equal(initialLPBalance + stakingBalance);

            // Check user info updated
            const userInfo = await tokenFarm.userInfo(user1.address);
            expect(userInfo.stakingBalance).to.equal(0);
            expect(userInfo.isStaking).to.equal(false);
            expect(userInfo.pendingRewards).to.be.gt(0); // Should have calculated rewards

            // Check total staking balance reduced
            expect(await tokenFarm.totalStakingBalance()).to.equal(ethers.parseEther("100"));
        });

        it("Should calculate pending rewards during withdrawal", async function () {
            // Withdraw should automatically calculate rewards before resetting staking balance
            const userInfoBefore = await tokenFarm.userInfo(user1.address);
            expect(userInfoBefore.pendingRewards).to.equal(0);

            await tokenFarm.connect(user1).withdraw();

            // Check that rewards were calculated and are pending
            const userInfoAfter = await tokenFarm.userInfo(user1.address);
            expect(userInfoAfter.pendingRewards).to.be.gt(0);
            
            // User should be able to claim these rewards even after withdrawing
            const pendingAmount = userInfoAfter.pendingRewards;
            await tokenFarm.connect(user1).claimRewards();
            
            const dappBalance = await dappToken.balanceOf(user1.address);
            expect(dappBalance).to.equal(pendingAmount);
        });

        it("Should reject withdrawal from non-staking users", async function () {
            await expect(tokenFarm.connect(user3).withdraw())
                .to.be.revertedWith("Only staking users can call this function");
        });

        it("Should handle complete flow: deposit -> accumulate rewards -> withdraw -> claim rewards", async function () {
            const depositAmount = ethers.parseEther("150");
            
            // 1. Fresh user deposits
            await tokenFarm.connect(user3).deposit(depositAmount);
            
            // 2. Accumulate rewards over time
            await advanceBlocks(15);
            
            // 3. Withdraw all tokens (should calculate rewards automatically)
            const initialLPBalance = await lpToken.balanceOf(user3.address);
            await tokenFarm.connect(user3).withdraw();
            
            // Verify LP tokens returned
            const finalLPBalance = await lpToken.balanceOf(user3.address);
            expect(finalLPBalance).to.equal(initialLPBalance + depositAmount);
            
            // 4. Claim accumulated rewards
            const userInfo = await tokenFarm.userInfo(user3.address);
            const pendingRewards = userInfo.pendingRewards;
            expect(pendingRewards).to.be.gt(0);
            
            await tokenFarm.connect(user3).claimRewards();
            
            // Verify DAPP tokens received
            const dappBalance = await dappToken.balanceOf(user3.address);
            expect(dappBalance).to.equal(pendingRewards);
            
            // Verify final state
            const finalUserInfo = await tokenFarm.userInfo(user3.address);
            expect(finalUserInfo.stakingBalance).to.equal(0);
            expect(finalUserInfo.isStaking).to.equal(false);
            expect(finalUserInfo.pendingRewards).to.equal(0);
        });

        it("Should handle withdrawal with zero balance correctly", async function () {
            // User deposits then withdraws
            await tokenFarm.connect(user3).deposit(ethers.parseEther("100"));
            await tokenFarm.connect(user3).withdraw();

            // Try to withdraw again (should fail)
            await expect(tokenFarm.connect(user3).withdraw())
                .to.be.revertedWith("Only staking users can call this function");
        });
    });

    describe("Edge Cases and Additional Tests", function () {
        it("Should handle proportional rewards correctly with different stake sizes", async function () {
            // User1: 10% of total stake
            await tokenFarm.connect(user1).deposit(ethers.parseEther("100"));
            // User2: 90% of total stake  
            await tokenFarm.connect(user2).deposit(ethers.parseEther("900"));

            await advanceBlocks(20);
            await tokenFarm.connect(owner).distributeRewardsAll();

            const user1Info = await tokenFarm.userInfo(user1.address);
            const user2Info = await tokenFarm.userInfo(user2.address);

            // User1 should get ~10% of total rewards (2 tokens out of 20)
            expect(user1Info.pendingRewards).to.be.closeTo(ethers.parseEther("2.0"), ethers.parseEther("0.1"));
            // User2 should get ~90% of total rewards (18 tokens out of 20)
            expect(user2Info.pendingRewards).to.be.closeTo(ethers.parseEther("18.0"), ethers.parseEther("0.1"));
        });

        it("Should maintain accuracy when users join and leave", async function () {
            // Initial state: User1 alone
            await tokenFarm.connect(user1).deposit(ethers.parseEther("100"));
            await advanceBlocks(10); // User1 gets all rewards for 10 blocks

            // User2 joins
            await tokenFarm.connect(user2).deposit(ethers.parseEther("100"));
            await advanceBlocks(10); // Both users share rewards for 10 blocks

            // User1 withdraws
            await tokenFarm.connect(user1).withdraw();
            await advanceBlocks(10); // User2 gets all rewards for 10 blocks

            await tokenFarm.connect(owner).distributeRewardsAll();

            // Check final balances
            const user1Info = await tokenFarm.userInfo(user1.address);
            const user2Info = await tokenFarm.userInfo(user2.address);

            // User1: 10 blocks alone + 5 blocks shared = 15 tokens
            expect(user1Info.pendingRewards).to.be.closeTo(ethers.parseEther("15.0"), ethers.parseEther("0.5"));
            // User2: 5 blocks shared + 10 blocks alone = 15 tokens
            expect(user2Info.pendingRewards).to.be.closeTo(ethers.parseEther("15.0"), ethers.parseEther("0.5"));
        });
    });

    describe("Bonus 4: Variable Block Rewards", function () {
        beforeEach(async function () {
            // Set up initial staking
            await tokenFarm.connect(user1).deposit(ethers.parseEther("100"));
        });

        it("Should allow owner to update reward per block within range", async function () {
            const newReward = ethers.parseEther("2.0");
            
            await expect(tokenFarm.connect(owner).setRewardPerBlock(newReward))
                .to.emit(tokenFarm, "RewardPerBlockUpdated")
                .withArgs(ethers.parseEther("1.0"), newReward);

            expect(await tokenFarm.rewardPerBlock()).to.equal(newReward);
        });

        it("Should reject reward updates from non-owner", async function () {
            const newReward = ethers.parseEther("2.0");
            
            await expect(tokenFarm.connect(user1).setRewardPerBlock(newReward))
                .to.be.revertedWith("Only owner can call this function");
        });

        it("Should reject reward per block below minimum", async function () {
            const tooLowReward = ethers.parseEther("0.05"); // Below 0.1 minimum
            
            await expect(tokenFarm.connect(owner).setRewardPerBlock(tooLowReward))
                .to.be.revertedWith("Reward per block must be within allowed range");
        });

        it("Should reject reward per block above maximum", async function () {
            const tooHighReward = ethers.parseEther("15.0"); // Above 10 maximum
            
            await expect(tokenFarm.connect(owner).setRewardPerBlock(tooHighReward))
                .to.be.revertedWith("Reward per block must be within allowed range");
        });

        it("Should accept reward per block at minimum boundary", async function () {
            const minReward = ethers.parseEther("0.1");
            
            await expect(tokenFarm.connect(owner).setRewardPerBlock(minReward))
                .to.emit(tokenFarm, "RewardPerBlockUpdated")
                .withArgs(ethers.parseEther("1.0"), minReward);

            expect(await tokenFarm.rewardPerBlock()).to.equal(minReward);
        });

        it("Should accept reward per block at maximum boundary", async function () {
            const maxReward = ethers.parseEther("10.0");
            
            await expect(tokenFarm.connect(owner).setRewardPerBlock(maxReward))
                .to.emit(tokenFarm, "RewardPerBlockUpdated")
                .withArgs(ethers.parseEther("1.0"), maxReward);

            expect(await tokenFarm.rewardPerBlock()).to.equal(maxReward);
        });

        it("Should distribute pending rewards before updating reward per block", async function () {
            // Let some blocks pass to accumulate rewards
            await advanceBlocks(5);
            
            // Check initial pending rewards (should be 0 until distributed)
            let userInfo = await tokenFarm.userInfo(user1.address);
            expect(userInfo.pendingRewards).to.equal(0);
            
            // Update reward per block (should trigger distribution)
            const newReward = ethers.parseEther("2.0");
            await tokenFarm.connect(owner).setRewardPerBlock(newReward);
            
            // Check that rewards were distributed
            userInfo = await tokenFarm.userInfo(user1.address);
            expect(userInfo.pendingRewards).to.be.gt(0);
        });

        it("Should calculate rewards with new reward rate after update", async function () {
            // Set up second user for proportion testing
            await tokenFarm.connect(user2).deposit(ethers.parseEther("100"));
            
            // Advance blocks with original reward rate (1 token per block)
            await advanceBlocks(10);
            await tokenFarm.connect(owner).distributeRewardsAll();
            
            // Check rewards with original rate (each user should get 0.5 tokens per block * 10 blocks = 5 tokens)
            let user1Info = await tokenFarm.userInfo(user1.address);
            expect(user1Info.pendingRewards).to.be.closeTo(ethers.parseEther("5.0"), ethers.parseEther("0.1"));
            
            // Update to higher reward rate
            const newReward = ethers.parseEther("4.0"); // 4 tokens per block
            await tokenFarm.connect(owner).setRewardPerBlock(newReward);
            
            // Advance more blocks with new rate
            await advanceBlocks(5);
            await tokenFarm.connect(owner).distributeRewardsAll();
            
            // Check updated rewards (original 5 + new: 0.5 * 4 * 5 = 10 additional = 15 total)
            user1Info = await tokenFarm.userInfo(user1.address);
            expect(user1Info.pendingRewards).to.be.closeTo(ethers.parseEther("15.0"), ethers.parseEther("0.2"));
        });

        it("Should handle reward rate changes correctly with multiple users", async function () {
            // Add more users with different stakes
            await tokenFarm.connect(user2).deposit(ethers.parseEther("300")); // user1: 100, user2: 300 (total: 400)
            
            // Generate rewards with default rate
            await advanceBlocks(8);
            await tokenFarm.connect(owner).distributeRewardsAll();
            
            // user1 should get 25% of rewards, user2 should get 75%
            let user1Info = await tokenFarm.userInfo(user1.address);
            let user2Info = await tokenFarm.userInfo(user2.address);
            expect(user1Info.pendingRewards).to.be.closeTo(ethers.parseEther("2.0"), ethers.parseEther("0.1")); // 8 * 1 * 0.25
            expect(user2Info.pendingRewards).to.be.closeTo(ethers.parseEther("6.0"), ethers.parseEther("0.1")); // 8 * 1 * 0.75
            
            // Change reward rate to 0.5 tokens per block
            const newReward = ethers.parseEther("0.5");
            await tokenFarm.connect(owner).setRewardPerBlock(newReward);
            
            // Generate more rewards with new rate
            await advanceBlocks(12);
            await tokenFarm.connect(owner).distributeRewardsAll();
            
            // Additional rewards with new rate: 12 * 0.5 = 6 total tokens
            // user1 gets 1.5 more (6 * 0.25), user2 gets 4.5 more (6 * 0.75)
            user1Info = await tokenFarm.userInfo(user1.address);
            user2Info = await tokenFarm.userInfo(user2.address);
            expect(user1Info.pendingRewards).to.be.closeTo(ethers.parseEther("3.5"), ethers.parseEther("0.1")); // 2.0 + 1.5
            expect(user2Info.pendingRewards).to.be.closeTo(ethers.parseEther("10.5"), ethers.parseEther("0.1")); // 6.0 + 4.5
        });

        it("Should return correct reward range", async function () {
            const [min, max] = await tokenFarm.getRewardRange();
            expect(min).to.equal(ethers.parseEther("0.1"));
            expect(max).to.equal(ethers.parseEther("10.0"));
        });
    });

    describe("Bonus 5: Withdrawal Fees", function () {
        beforeEach(async function () {
            // Set up staking with rewards
            await tokenFarm.connect(user1).deposit(ethers.parseEther("100"));
            await advanceBlocks(10);
            await tokenFarm.connect(owner).distributeRewardsAll();
        });

        describe("Fee Configuration", function () {
            it("Should allow owner to update fee percentage within limits", async function () {
                const newFee = 750; // 7.5%
                
                await expect(tokenFarm.connect(owner).setFeePercentage(newFee))
                    .to.emit(tokenFarm, "FeePercentageUpdated")
                    .withArgs(500, newFee); // From 5% to 7.5%

                const [currentFee] = await tokenFarm.getFeeInfo();
                expect(currentFee).to.equal(newFee);
            });

            it("Should reject fee updates from non-owner", async function () {
                await expect(tokenFarm.connect(user1).setFeePercentage(750))
                    .to.be.revertedWith("Only owner can call this function");
            });

            it("Should reject fee percentage above maximum", async function () {
                const tooHighFee = 1500; // 15% (above 10% max)
                
                await expect(tokenFarm.connect(owner).setFeePercentage(tooHighFee))
                    .to.be.revertedWith("Fee percentage exceeds maximum allowed");
            });

            it("Should accept fee percentage at maximum boundary", async function () {
                const maxFee = 1000; // 10%
                
                await expect(tokenFarm.connect(owner).setFeePercentage(maxFee))
                    .to.emit(tokenFarm, "FeePercentageUpdated")
                    .withArgs(500, maxFee);

                const [currentFee] = await tokenFarm.getFeeInfo();
                expect(currentFee).to.equal(maxFee);
            });

            it("Should accept zero fee percentage", async function () {
                await expect(tokenFarm.connect(owner).setFeePercentage(0))
                    .to.emit(tokenFarm, "FeePercentageUpdated")
                    .withArgs(500, 0);

                const [currentFee] = await tokenFarm.getFeeInfo();
                expect(currentFee).to.equal(0);
            });
        });

        describe("Fee Calculation", function () {
            it("Should calculate fees correctly", async function () {
                const rewardAmount = ethers.parseEther("100");
                const [fee, netAmount] = await tokenFarm.calculateFee(rewardAmount);
                
                // With 5% fee: fee = 5 tokens, netAmount = 95 tokens
                expect(fee).to.equal(ethers.parseEther("5"));
                expect(netAmount).to.equal(ethers.parseEther("95"));
            });

            it("Should calculate fees with different percentages", async function () {
                // Change fee to 2.5%
                await tokenFarm.connect(owner).setFeePercentage(250);
                
                const rewardAmount = ethers.parseEther("200");
                const [fee, netAmount] = await tokenFarm.calculateFee(rewardAmount);
                
                // With 2.5% fee: fee = 5 tokens, netAmount = 195 tokens
                expect(fee).to.equal(ethers.parseEther("5"));
                expect(netAmount).to.equal(ethers.parseEther("195"));
            });

            it("Should handle zero fee calculation", async function () {
                await tokenFarm.connect(owner).setFeePercentage(0);
                
                const rewardAmount = ethers.parseEther("100");
                const [fee, netAmount] = await tokenFarm.calculateFee(rewardAmount);
                
                expect(fee).to.equal(0);
                expect(netAmount).to.equal(rewardAmount);
            });
        });

        describe("Fee Collection on Reward Claims", function () {
            it("Should charge correct fee when claiming rewards", async function () {
                const userInfo = await tokenFarm.userInfo(user1.address);
                const pendingRewards = userInfo.pendingRewards;
                
                // Calculate expected fee (5%)
                const expectedFee = (pendingRewards * 500n) / 10000n;
                const expectedNetAmount = pendingRewards - expectedFee;
                
                await expect(tokenFarm.connect(user1).claimRewards())
                    .to.emit(tokenFarm, "RewardsClaimed")
                    .withArgs(user1.address, expectedNetAmount, expectedFee);
                
                // Verify user received net amount
                const userBalance = await dappToken.balanceOf(user1.address);
                expect(userBalance).to.equal(expectedNetAmount);
                
                // Verify fee was collected
                const [, , collectedFees] = await tokenFarm.getFeeInfo();
                expect(collectedFees).to.equal(expectedFee);
            });

            it("Should accumulate fees from multiple claims", async function () {
                // Set up second user
                await tokenFarm.connect(user2).deposit(ethers.parseEther("100"));
                await advanceBlocks(5);
                await tokenFarm.connect(owner).distributeRewardsAll();
                
                // Both users claim rewards
                const user1Info = await tokenFarm.userInfo(user1.address);
                const user2Info = await tokenFarm.userInfo(user2.address);
                
                const expectedFee1 = (user1Info.pendingRewards * 500n) / 10000n;
                const expectedFee2 = (user2Info.pendingRewards * 500n) / 10000n;
                
                await tokenFarm.connect(user1).claimRewards();
                await tokenFarm.connect(user2).claimRewards();
                
                // Check total accumulated fees
                const [, , collectedFees] = await tokenFarm.getFeeInfo();
                expect(collectedFees).to.equal(expectedFee1 + expectedFee2);
            });

            it("Should work with zero fee percentage", async function () {
                await tokenFarm.connect(owner).setFeePercentage(0);
                
                const userInfo = await tokenFarm.userInfo(user1.address);
                const pendingRewards = userInfo.pendingRewards;
                
                await expect(tokenFarm.connect(user1).claimRewards())
                    .to.emit(tokenFarm, "RewardsClaimed")
                    .withArgs(user1.address, pendingRewards, 0);
                
                // User should receive full amount
                const userBalance = await dappToken.balanceOf(user1.address);
                expect(userBalance).to.equal(pendingRewards);
                
                // No fees collected
                const [, , collectedFees] = await tokenFarm.getFeeInfo();
                expect(collectedFees).to.equal(0);
            });
        });

        describe("Fee Withdrawal", function () {
            beforeEach(async function () {
                // Generate some fees by having user claim rewards
                await tokenFarm.connect(user1).claimRewards();
            });

            it("Should allow owner to withdraw collected fees", async function () {
                const [, , collectedFees] = await tokenFarm.getFeeInfo();
                expect(collectedFees).to.be.gt(0);
                
                const initialOwnerBalance = await dappToken.balanceOf(owner.address);
                
                await expect(tokenFarm.connect(owner).withdrawFees())
                    .to.emit(tokenFarm, "FeesWithdrawn")
                    .withArgs(owner.address, collectedFees);
                
                // Check owner received the fees
                const finalOwnerBalance = await dappToken.balanceOf(owner.address);
                expect(finalOwnerBalance).to.equal(initialOwnerBalance + collectedFees);
                
                // Check collected fees reset to 0
                const [, , remainingFees] = await tokenFarm.getFeeInfo();
                expect(remainingFees).to.equal(0);
            });

            it("Should reject fee withdrawal from non-owner", async function () {
                await expect(tokenFarm.connect(user1).withdrawFees())
                    .to.be.revertedWith("Only owner can call this function");
            });

            it("Should reject withdrawal when no fees collected", async function () {
                // First withdraw all fees
                await tokenFarm.connect(owner).withdrawFees();
                
                // Try to withdraw again
                await expect(tokenFarm.connect(owner).withdrawFees())
                    .to.be.revertedWith("No fees to withdraw");
            });

            it("Should handle multiple fee withdrawals", async function () {
                // Withdraw first batch of fees
                const [, , firstBatchFees] = await tokenFarm.getFeeInfo();
                await tokenFarm.connect(owner).withdrawFees();
                
                // Generate more fees
                await tokenFarm.connect(user2).deposit(ethers.parseEther("50"));
                await advanceBlocks(5);
                await tokenFarm.connect(owner).distributeRewardsAll();
                await tokenFarm.connect(user2).claimRewards();
                
                // Withdraw second batch
                const [, , secondBatchFees] = await tokenFarm.getFeeInfo();
                expect(secondBatchFees).to.be.gt(0);
                
                const ownerBalanceBeforeSecond = await dappToken.balanceOf(owner.address);
                await tokenFarm.connect(owner).withdrawFees();
                
                const ownerBalanceAfterSecond = await dappToken.balanceOf(owner.address);
                expect(ownerBalanceAfterSecond).to.equal(ownerBalanceBeforeSecond + secondBatchFees);
            });
        });

        describe("Integration with Variable Fees", function () {
            it("Should work correctly when fee percentage changes mid-operation", async function () {
                // Claim with initial 5% fee
                const initialUserInfo = await tokenFarm.userInfo(user1.address);
                const initialPending = initialUserInfo.pendingRewards;
                const initialFee = (initialPending * 500n) / 10000n;
                
                await tokenFarm.connect(user1).claimRewards();
                
                // Generate more rewards
                await advanceBlocks(5);
                await tokenFarm.connect(owner).distributeRewardsAll();
                
                // Change fee to 10%
                await tokenFarm.connect(owner).setFeePercentage(1000);
                
                // Claim with new fee
                const newUserInfo = await tokenFarm.userInfo(user1.address);
                const newPending = newUserInfo.pendingRewards;
                const newFee = (newPending * 1000n) / 10000n;
                
                await tokenFarm.connect(user1).claimRewards();
                
                // Check total fees collected
                const [, , totalFees] = await tokenFarm.getFeeInfo();
                expect(totalFees).to.equal(initialFee + newFee);
            });
        });
    });
});
