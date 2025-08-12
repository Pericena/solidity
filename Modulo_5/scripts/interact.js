const { ethers } = require("hardhat");

// Cargar las direcciones de los contratos desplegados
const addresses = require('../deployed-addresses.json');

async function main() {
    console.log("🔗 Conectando a contratos desplegados...");
    
    const [deployer, user1, user2] = await ethers.getSigners();
    
    // Conectar a los contratos
    const dappToken = await ethers.getContractAt("DAppToken", addresses.dappToken);
    const lpToken = await ethers.getContractAt("LPToken", addresses.lpToken);
    const tokenFarm = await ethers.getContractAt("TokenFarm", addresses.tokenFarm);
    
    console.log("✅ Contratos conectados");
    
    // Ejemplo de interacción
    console.log("\n" + "=".repeat(50));
    console.log("📊 ESTADO ACTUAL DE LOS CONTRATOS");
    console.log("=".repeat(50));
    
    // Información del TokenFarm
    console.log("🏪 TokenFarm:");
    console.log("   • Nombre:", await tokenFarm.name());
    console.log("   • Owner:", await tokenFarm.owner());
    console.log("   • Reward per block:", ethers.formatEther(await tokenFarm.rewardPerBlock()));
    console.log("   • Fee percentage:", await tokenFarm.feePercentage() / 100 + "%");
    console.log("   • Total staking balance:", ethers.formatEther(await tokenFarm.totalStakingBalance()));
    
    const [currentFee, maxFee, collectedFees] = await tokenFarm.getFeeInfo();
    console.log("   • Collected fees:", ethers.formatEther(collectedFees));
    
    // Balances
    console.log("\n💰 Balances:");
    console.log("   • Deployer LP tokens:", ethers.formatEther(await lpToken.balanceOf(deployer.address)));
    console.log("   • Deployer DAPP tokens:", ethers.formatEther(await dappToken.balanceOf(deployer.address)));
    
    console.log("\n" + "=".repeat(50));
    console.log("🧪 EJEMPLO DE INTERACCIÓN");
    console.log("=".repeat(50));
    
    // Ejemplo: Hacer staking
    const stakeAmount = ethers.parseEther("100");
    
    console.log("\n1️⃣ Aprobando LP tokens para staking...");
    await lpToken.approve(addresses.tokenFarm, stakeAmount);
    console.log("   ✅ Aprobación completada");
    
    console.log("\n2️⃣ Haciendo staking de", ethers.formatEther(stakeAmount), "LP tokens...");
    const depositTx = await tokenFarm.deposit(stakeAmount);
    await depositTx.wait();
    console.log("   ✅ Staking completado");
    
    // Verificar estado después del staking
    const userInfo = await tokenFarm.userInfo(deployer.address);
    console.log("\n📈 Estado después del staking:");
    console.log("   • Staking balance:", ethers.formatEther(userInfo.stakingBalance));
    console.log("   • Is staking:", userInfo.isStaking);
    console.log("   • Total staking balance:", ethers.formatEther(await tokenFarm.totalStakingBalance()));
    
    // Simular algunos bloques y distribuir recompensas
    console.log("\n3️⃣ Simulando tiempo (minando 10 bloques)...");
    for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine");
    }
    console.log("   ✅ Bloques minados");
    
    console.log("\n4️⃣ Distribuyendo recompensas...");
    const distributeTx = await tokenFarm.distributeRewardsAll();
    await distributeTx.wait();
    console.log("   ✅ Recompensas distribuidas");
    
    // Verificar recompensas pendientes
    const updatedUserInfo = await tokenFarm.userInfo(deployer.address);
    console.log("\n🎁 Recompensas pendientes:", ethers.formatEther(updatedUserInfo.pendingRewards));
    
    // Calcular fee que se cobraría
    const [fee, netAmount] = await tokenFarm.calculateFee(updatedUserInfo.pendingRewards);
    console.log("   • Fee que se cobraría:", ethers.formatEther(fee));
    console.log("   • Cantidad neta a recibir:", ethers.formatEther(netAmount));
    
    console.log("\n5️⃣ Reclamando recompensas...");
    const claimTx = await tokenFarm.claimRewards();
    await claimTx.wait();
    console.log("   ✅ Recompensas reclamadas");
    
    // Estado final
    console.log("\n📊 Estado final:");
    console.log("   • DAPP tokens del deployer:", ethers.formatEther(await dappToken.balanceOf(deployer.address)));
    const finalFeeInfo = await tokenFarm.getFeeInfo();
    console.log("   • Fees recolectados:", ethers.formatEther(finalFeeInfo[2]));
    
    console.log("\n" + "=".repeat(50));
    console.log("🎉 ¡INTERACCIÓN COMPLETADA!");
    console.log("=".repeat(50));
    console.log("💡 Próximos pasos que puedes probar:");
    console.log("   • Cambiar reward per block: tokenFarm.setRewardPerBlock()");
    console.log("   • Cambiar fee percentage: tokenFarm.setFeePercentage()");
    console.log("   • Retirar fees: tokenFarm.withdrawFees()");
    console.log("   • Hacer withdraw: tokenFarm.withdraw()");
    console.log("   • Agregar más usuarios para testing");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error en la interacción:", error);
        process.exit(1);
    });
