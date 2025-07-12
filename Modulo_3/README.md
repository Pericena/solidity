¡Perfecto Luishiño! 🔥
Aquí tienes tu `README.md` listo para que lo pongas en tu repositorio de GitHub o lo presentes como parte del proyecto de forma pro:

---

```markdown
# 🛠 Proyecto – SimpleDEX de Luishiño

> Exchange descentralizado simple (AMM) usando Solidity, ERC-20 y pruebas en Sepolia  
> Parte del Módulo 3 – Taller de Solidity – Ethereum Bolivia

---

## 📦 Descripción General

`SimpleDEX` es un exchange descentralizado básico que permite intercambiar dos tokens ERC-20 (TokenA y TokenB) mediante un pool de liquidez, usando la fórmula `x * y = k`.

Este proyecto está desarrollado en Solidity y desplegado en la red Sepolia para pruebas.

---

## ⚙️ Funcionalidades

- ✅ `addLiquidity(uint256 amountA, uint256 amountB)`  
  Agrega liquidez en pares de TokenA y TokenB (solo owner).

- 🔁 `swapAforB(uint256 amountAIn)`  
  Intercambia TokenA por TokenB al precio actual.

- 🔁 `swapBforA(uint256 amountBIn)`  
  Intercambia TokenB por TokenA.

- 🚪 `removeLiquidity(uint256 amountA, uint256 amountB)`  
  Retira liquidez del pool (solo owner).

- 📈 `getPrice(address _token)`  
  Retorna el precio actual de TokenA o TokenB basado en su contraparte.

---

## 🔐 Seguridad y Validaciones

- `require()` para validar entradas y condiciones.
- `modifier onlyOwner` para proteger funciones críticas.
- Emisión de eventos:  
  - `LiquidityAdded`  
  - `TokensSwapped`  
  - `LiquidityRemoved`

---

## 🧠 Consideraciones Técnicas

- 🧮 Lógica basada en fórmula de producto constante `x * y = k`
- 💰 Comisión del 0.3% (ajuste con 997 / 1000 en swaps)
- 🔁 Interacción segura con tokens usando `IERC20`, `approve`, y `transferFrom`
- 🧩 Cálculos encapsulados en funciones internas (`getAmountOut`)

---

## 🧪 Pruebas Realizadas

- ✅ Deploy de TokenA y TokenB con 1,000,000 unidades cada uno
- ✅ Aprobación y transferencia de tokens al contrato DEX
- ✅ Agregado de liquidez inicial (`5000 A` y `5000 B`)
- ✅ Intercambio de 1000 TokenA por TokenB (cuenta secundaria)
- ✅ Cálculo correcto del precio con `getPrice(...)`
- ✅ Retiro de liquidez parcial sin errores

---

## 📤 Despliegue

- 🛠 Red: Sepolia Testnet  
- 🔎 Contratos verificados en Etherscan:

| Contrato    | Dirección                                                                 |
|-------------|---------------------------------------------------------------------------|
| TokenA      | `0xfb9fa57c936FaD1e4dD83123f91e16e946695113`                             |
| TokenB      | `0x54A0a8b6268cB238A7041B8E33DA01F5De6e4307`                             |
| SimpleDEX   | `0x6434Fc2404aEb07568B60e301fa7b7bBE3Bc95d9`                             |

---

## 🧰 Herramientas Utilizadas

- Solidity (Remix IDE)
- MetaMask
- Etherscan
- Ethereum Unit Converter
- ABI Encoder Online

---

## 📁 Estructura del Proyecto

```

projects/
└── module-03/
├── TokenA.sol         # ERC-20 básico
├── TokenB.sol         # ERC-20 básico
└── SimpleDEX.sol      # Contrato principal del DEX

```

---

## 🔮 Mejoras Futuras

- 🌐 Interfaz DApp en React + Tailwind
- 🔐 Integración con MetaMask (ethers.js)
- ⚖️ Control de slippage dinámico
- 🧪 Pruebas automatizadas con Hardhat o Foundry

---

## 👨‍💻 Autor

**Luishiño Pericena Choque**  
💻 Desarrollador Web y entusiasta de la Ciberseguridad  
🌐 Blog: [https://lpericena.blogspot.com](https://lpericena.blogspot.com)  
📍 Bolivia | Taller Ethereum Bolivia – 2025

---

## 📜 Licencia

Este proyecto está bajo la licencia **MIT**.  
Ver el archivo [`LICENSE`](LICENSE) para más detalles.
```

---
