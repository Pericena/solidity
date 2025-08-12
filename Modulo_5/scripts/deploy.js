const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Iniciando despliegue de contratos...");
    
    // Obtener las cuentas
    const [deployer] = await ethers.getSigners();
    
    console.log("📋 Desplegando contratos con la cuenta:", deployer.address);
    console.log("💰 Balance de la cuenta:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    // 1. Desplegar DAppToken
    console.log("\n📄 Desplegando DAppToken...");
    const DAppToken = await ethers.getContractFactory("DAppToken");
    const dappToken = await DAppToken.deploy(deployer.address);
    await dappToken.waitForDeployment();
    
    console.log("✅ DAppToken desplegado en:", await dappToken.getAddress());
    
    // 2. Desplegar LPToken
    console.log("\n📄 Desplegando LPToken...");
    const LPToken = await ethers.getContractFactory("LPToken");
    const lpToken = await LPToken.deploy(deployer.address);
    await lpToken.waitForDeployment();
    
    console.log("✅ LPToken desplegado en:", await lpToken.getAddress());
    
    // 3. Desplegar TokenFarm
    console.log("\n📄 Desplegando TokenFarm...");
    const TokenFarm = await ethers.getContractFactory("TokenFarm");
    const tokenFarm = await TokenFarm.deploy(await dappToken.getAddress(), await lpToken.getAddress());
    await tokenFarm.waitForDeployment();
    
    console.log("✅ TokenFarm desplegado en:", await tokenFarm.getAddress());
    
    // 4. Transferir ownership de DAppToken a TokenFarm para que pueda mintear recompensas
    console.log("\n🔄 Transfiriendo ownership de DAppToken a TokenFarm...");
    await dappToken.transferOwnership(await tokenFarm.getAddress());
    console.log("✅ Ownership transferido");
    
    // 5. Mintear algunos LP tokens para testing (opcional)
    console.log("\n🪙 Minteando LP tokens para testing...");
    const mintAmount = ethers.parseEther("1000");
    await lpToken.mint(deployer.address, mintAmount);
    console.log("✅ Minteados", ethers.formatEther(mintAmount), "LP tokens al deployer");
    
    // 6. Resumen del despliegue
    console.log("\n" + "=".repeat(50));
    console.log("🎉 ¡DESPLIEGUE COMPLETADO!");
    console.log("=".repeat(50));
    console.log("📋 Resumen de contratos:");
    console.log("   • DAppToken:", await dappToken.getAddress());
    console.log("   • LPToken:", await lpToken.getAddress());
    console.log("   • TokenFarm:", await tokenFarm.getAddress());
    console.log("\n💡 Información útil:");
    console.log("   • Owner de los contratos:", deployer.address);
    console.log("   • LP Tokens disponibles:", ethers.formatEther(mintAmount));
    console.log("   • Reward per block inicial:", ethers.formatEther(await tokenFarm.rewardPerBlock()));
    
    const feePercentage = await tokenFarm.feePercentage();
    console.log("   • Fee percentage inicial:", Number(feePercentage) / 100 + "%");
    
    console.log("\n🔗 Para interactuar con los contratos:");
    console.log("   1. Usa las direcciones mostradas arriba");
    console.log("   2. Ejecuta: npx hardhat console --network localhost");
    console.log("   3. O usa el script de interacción incluido");
    
    // Guardar las direcciones en un archivo JSON para uso posterior
    const addresses = {
        dappToken: await dappToken.getAddress(),
        lpToken: await lpToken.getAddress(),
        tokenFarm: await tokenFarm.getAddress(),
        deployer: deployer.address
    };
    
    require('fs').writeFileSync(
        'deployed-addresses.json', 
        JSON.stringify(addresses, null, 2)
    );
    console.log("\n💾 Direcciones guardadas en 'deployed-addresses.json'");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error en el despliegue:", error);
        process.exit(1);
    });
