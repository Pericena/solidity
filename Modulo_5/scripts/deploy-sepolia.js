const hre = require("hardhat");

async function main() {
    console.log("\n🚀 DESPLEGANDO EN SEPOLIA TESTNET...");
    console.log("=" .repeat(50));

    // Verificar red
    const network = hre.network.name;
    if (network !== "sepolia") {
        console.error("❌ Error: Este script debe ejecutarse en la red Sepolia");
        console.log("   Usa: npx hardhat run scripts/deploy-sepolia.js --network sepolia");
        process.exit(1);
    }

    // Obtener cuenta del deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("📋 Desplegando contratos con la cuenta:", deployer.address);
    
    // Verificar balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Balance de la cuenta:", hre.ethers.formatEther(balance), "ETH");
    
    if (balance < hre.ethers.parseEther("0.01")) {
        console.error("❌ Error: Necesitas al menos 0.01 ETH en Sepolia");
        console.log("   Consigue ETH gratis en: https://sepoliafaucet.com/");
        process.exit(1);
    }

    console.log("\n⏳ Desplegando contratos...");

    // 1. Desplegar DAppToken
    console.log("📄 Desplegando DAppToken...");
    const DAppToken = await hre.ethers.getContractFactory("DAppToken");
    const dappToken = await DAppToken.deploy(deployer.address);
    await dappToken.waitForDeployment();
    console.log("✅ DAppToken desplegado en:", await dappToken.getAddress());

    // 2. Desplegar LPToken
    console.log("📄 Desplegando LPToken...");
    const LPToken = await hre.ethers.getContractFactory("LPToken");
    const lpToken = await LPToken.deploy(deployer.address);
    await lpToken.waitForDeployment();
    console.log("✅ LPToken desplegado en:", await lpToken.getAddress());

    // 3. Desplegar TokenFarm
    console.log("📄 Desplegando TokenFarm...");
    const TokenFarm = await hre.ethers.getContractFactory("TokenFarm");
    const tokenFarm = await TokenFarm.deploy(
        await dappToken.getAddress(),
        await lpToken.getAddress()
    );
    await tokenFarm.waitForDeployment();
    console.log("✅ TokenFarm desplegado en:", await tokenFarm.getAddress());

    // 4. Transferir ownership de DAppToken a TokenFarm
    console.log("🔄 Transfiriendo ownership de DAppToken a TokenFarm...");
    const transferTx = await dappToken.transferOwnership(await tokenFarm.getAddress());
    await transferTx.wait();
    console.log("✅ Ownership transferido");

    // 5. Mintear algunos LP tokens para testing
    console.log("🪙 Minteando LP tokens para testing...");
    const mintAmount = hre.ethers.parseEther("1000");
    const mintTx = await lpToken.mint(deployer.address, mintAmount);
    await mintTx.wait();
    console.log("✅ Minteados", hre.ethers.formatEther(mintAmount), "LP tokens al deployer");

    // Guardar direcciones
    const addresses = {
        network: "sepolia",
        chainId: 11155111,
        deployer: deployer.address,
        contracts: {
            DAppToken: await dappToken.getAddress(),
            LPToken: await lpToken.getAddress(),
            TokenFarm: await tokenFarm.getAddress()
        },
        deployedAt: new Date().toISOString()
    };

    const fs = require('fs');
    fs.writeFileSync('deployed-addresses-sepolia.json', JSON.stringify(addresses, null, 2));

    console.log("\n" + "=".repeat(50));
    console.log("🎉 ¡DESPLIEGUE EN SEPOLIA COMPLETADO!");
    console.log("=" .repeat(50));
    console.log("📋 Resumen de contratos:");
    console.log("   • DAppToken:", await dappToken.getAddress());
    console.log("   • LPToken:", await lpToken.getAddress());
    console.log("   • TokenFarm:", await tokenFarm.getAddress());
    
    console.log("\n💡 Información útil:");
    console.log("   • Red:", network.toUpperCase());
    console.log("   • Owner de los contratos:", deployer.address);
    console.log("   • LP Tokens disponibles:", hre.ethers.formatEther(mintAmount));
    console.log("   • Reward per block inicial:", hre.ethers.formatEther(await tokenFarm.rewardPerBlock()));
    
    const feePercentage = await tokenFarm.feePercentage();
    console.log("   • Fee percentage inicial:", Number(feePercentage) / 100 + "%");

    console.log("\n🔗 Ver en Etherscan:");
    console.log("   • DAppToken:", `https://sepolia.etherscan.io/address/${await dappToken.getAddress()}`);
    console.log("   • LPToken:", `https://sepolia.etherscan.io/address/${await lpToken.getAddress()}`);
    console.log("   • TokenFarm:", `https://sepolia.etherscan.io/address/${await tokenFarm.getAddress()}`);

    console.log("\n📝 PRÓXIMO PASO - VERIFICAR CONTRATOS:");
    console.log("   Ejecuta estos comandos para verificar en Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${await dappToken.getAddress()}`);
    console.log(`   npx hardhat verify --network sepolia ${await lpToken.getAddress()}`);
    console.log(`   npx hardhat verify --network sepolia ${await tokenFarm.getAddress()} "${await dappToken.getAddress()}" "${await lpToken.getAddress()}"`);

    console.log("\n💾 Direcciones guardadas en 'deployed-addresses-sepolia.json'");
}

main().catch((error) => {
    console.error("❌ Error en el despliegue:", error);
    process.exitCode = 1;
});
