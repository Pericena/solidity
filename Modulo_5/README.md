# 🌐 Ejercicio Simple DeFi Yield Farming

### Cómo usar Farms (Yield Farming) en PancakeSwap
- https://docs.pancakeswap.finance/products/yield-farming/how-to-use-farms

### Repositorio con el codigo :
- https://gist.github.com/luisvid/5a87ce5690451e965bb3c86f37a3cfbd

## Caso de uso

- En este ejercicio, implementarás un proyecto DeFi simple de Token Farm.

- La Farm debe permitir a los usuarios realizar depósitos y retiros de un token mock LP.
Los usuarios también pueden reclamar las recompensas generadas durante el staking. Estas recompensas son tokens de la plataforma: nombre: "DApp Token", token: "DAPP".
El contrato contiene el marco y comentarios necesarios para implementar el contrato. Sigue los comentarios indicados para completarlo.

#### El caso de uso del contrato Simple Token Farm es el siguiente:

- Los usuarios depositan tokens LP con la función deposit().
- Los usuarios pueden recolectar o reclamar recompensas con la función claimRewards().
- Los usuarios pueden deshacer el staking de todos sus tokens LP con la función withdraw(), pero aún pueden reclamar las recompensas pendientes.
- Cada vez que se actualiza la cantidad de tokens LP en staking, las recompensas deben recalcularse primero.
- El propietario de la plataforma puede llamar al método distributeRewardsAll() a intervalos regulares para actualizar las recompensas pendientes de todos los usuarios en staking.


[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-FFDB1C?style=flat-square&logo=ethereum)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.0-4E5EE4?style=flat-square&logo=openzeppelin)](https://openzeppelin.com/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen?style=flat-square)](LICENSE)

> 🚀 Un protocolo DeFi para staking de tokens LP con recompensas dinámicas, sistema de comisiones configurable y seguridad de alto nivel.  
> 📡 Implementado y verificado en **Ethereum Sepolia Testnet**.

---

## 📍 Contratos en Sepolia

| Contrato      | Dirección | Etherscan |
|---------------|-----------|-----------|
| **TokenFarm** | `0xC25DdA09aC0EdB6344A986A51CF4A892F61746E1` | [Ver Código](https://sepolia.etherscan.io/address/0xC25DdA09aC0EdB6344A986A51CF4A892F61746E1#code) |
| **DAppToken** | `0xC75BE7f5CF5031ae1F6588962CB495935B06a145` | [Ver Código](https://sepolia.etherscan.io/address/0xC75BE7f5CF5031ae1F6588962CB495935B06a145#code) |
| **LPToken**   | `0xB7Aad60043B70dEFe18cEEc17bE4E89Ad9Cc5DE5` | [Ver Código](https://sepolia.etherscan.io/address/0xB7Aad60043B70dEFe18cEEc17bE4E89Ad9Cc5DE5#code) |

---

## 🎯 Características

### ⚡ Funcionalidades Principales
- Stake de LP tokens para generar recompensas
- Recompensas distribuidas proporcionalmente
- Retiro flexible en cualquier momento
- Reclamo de recompensas acumuladas

### 🛠 Funcionalidades Avanzadas
- Modificadores de seguridad (`onlyOwner`, `onlyStaker`)
- Struct optimizado para eficiencia
- Configuración dinámica de recompensas por bloque
- Sistema de comisiones de 0% a 10%
- Suite de tests con más de 50 casos

### 🔒 Seguridad
- Uso de contratos auditados de **OpenZeppelin**
- Protección contra ataques de reentrada
- Control de acceso avanzado
- Validación estricta de parámetros

---

## 📊 Estadísticas
- **Líneas de código:** ~400
- **Contratos:** 3
- **Tests:** 50+
- **Optimización de gas:** ✅
- **Código verificado en Etherscan**

---

## 🛠 Tech Stack
- Blockchain: Ethereum (Sepolia)
- Lenguaje: Solidity ^0.8.28
- Framework: Hardhat
- Librerías: OpenZeppelin ^5.0.0
- Testing: Chai + Mocha
- Deploy: Hardhat Scripts
- Verificación: Etherscan API

---

## 🚀 Instalación
```bash
git clone https://github.com/Pericena/SimpleDefiFarm.git
cd SimpleDefiFarm
npm install
npm run compile
```

## 🧪 Tests
```bash
npm test
npm run test:farm
npm run node
npm run deploy:local
```

---

## 📜 Funciones Clave

### 👤 Usuario
```solidity
function deposit(uint256 _amount) external
function withdraw(uint256 _amount) external
function claimRewards() external
function getStakedBalance(address _user) external view returns (uint256)
function getPendingRewards(address _user) external view returns (uint256)
```

### 🛡 Owner
```solidity
function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner
function setFeePercentage(uint256 _feePercentage) external onlyOwner
function distributeRewards() external onlyOwner
function emergencyWithdraw() external onlyOwner
```

---

## 🤝 Contribución
1. Haz un **Fork**
2. Crea una rama (`feature/NuevaFuncionalidad`)
3. Haz commit de tus cambios
4. Sube la rama
5. Abre un **Pull Request**

---

## 📞 Contacto
**Autor:** [Pericena](https://github.com/Pericena)  
**Repositorio:** [Simple DeFi Farm](https://github.com/Pericena/SimpleDefiFarm)

⭐ Si este proyecto te resulta útil, ¡dale una estrella en GitHub! ⭐
