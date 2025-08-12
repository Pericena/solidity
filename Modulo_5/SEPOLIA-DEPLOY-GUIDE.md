# ⚡ GUÍA PARA DESPLEGAR EN SEPOLIA TESTNET

## 📌 Requisitos Previos

### 1. **Configurar MetaMask con la red Sepolia**
- Instala la extensión MetaMask en tu navegador.
- Añade la red Sepolia con los siguientes datos:
  - Nombre de red: Ethereum Sepolia
  - URL RPC: `https://sepolia.infura.io/v3/YOUR_INFURA_ID`
  - ID de cadena: `11155111`
  - Símbolo: `ETH`
  - Explorador: [https://sepolia.etherscan.io](https://sepolia.etherscan.io)

### 2. **Obtener ETH de prueba para Sepolia**
Solicita fondos gratuitos en estos faucets:
- [sepoliafaucet.com](https://sepoliafaucet.com/)
- [faucet.sepolia.dev](https://faucet.sepolia.dev/)
- [faucet-sepolia.rockx.com](https://faucet-sepolia.rockx.com/)

### 3. **Configurar APIs necesarias**

#### **Infura (conexión a Sepolia)**
- Regístrate en [Infura](https://infura.io) y crea un proyecto.
- Copia el Project ID que te brindan.

#### **Etherscan (para verificar contratos)**
- Regístrate en [Etherscan](https://etherscan.io/apis).
- Genera una API Key gratuita para uso en verificación.

---

## ⚙️ Configuración del entorno

### 1. Crear archivo `.env` con las siguientes variables:

```env
# Clave privada MetaMask (sin prefijo 0x)
PRIVATE_KEY=tu_clave_privada_aqui

# Project ID de Infura
INFURA_PROJECT_ID=tu_project_id_infura

# URL RPC completa para Sepolia
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/tu_project_id_infura

# API Key para Etherscan
ETHERSCAN_API_KEY=tu_api_key_etherscan
```

> **Importante:**  
> - No subas este archivo a tu repositorio público.  
> - Utiliza siempre una wallet de prueba.  
> - Nunca uses ETH real para pruebas.

### 2. Exportar tu clave privada desde MetaMask
- Abre MetaMask → Configuración → Cuenta → Exportar clave privada.  
- Ingresa tu contraseña y copia la clave sin el `0x`.

---

## 🚀 Proceso de despliegue

### Paso 1: Compila los contratos
```bash
npm run compile
```

### Paso 2: Despliega en Sepolia
```bash
npm run deploy:sepolia
```

El script realizará automáticamente:  
- Verificación de saldo en ETH para pagar gas  
- Despliegue de los contratos `DAppToken`, `LPToken` y `TokenFarm`  
- Configuración de permisos y minting inicial  
- Registro de las direcciones en `deployed-addresses-sepolia.json`

---

## 🔍 Verificación en Etherscan

Ejecuta los siguientes comandos para validar tu despliegue:

```bash
npx hardhat verify --network sepolia [DAPP_TOKEN_ADDRESS]

npx hardhat verify --network sepolia [LP_TOKEN_ADDRESS]

npx hardhat verify --network sepolia [TOKEN_FARM_ADDRESS] "[DAPP_TOKEN_ADDRESS]" "[LP_TOKEN_ADDRESS]"
```

> Las direcciones se muestran en la terminal después del despliegue.

---

## ✅ Confirmación del despliegue

### En consola verás:
```
🎉 ¡Despliegue completado en Sepolia!
Contratos desplegados:
 - DAppToken: 0x...
 - LPToken: 0x...
 - TokenFarm: 0x...
```

### En Sepolia Etherscan:
- Busca cada dirección para verificar que estén activas y el código fuente visible.
- Deberías poder interactuar con ellos desde la pestaña “Write Contract”.

---

## ⚡ Cómo interactuar con tus contratos

### Método 1: Usar consola Hardhat en Sepolia
```bash
npm run console:sepolia
```

### Método 2: Usar MetaMask con Etherscan
- Ingresa a la página del contrato en Etherscan.
- Selecciona “Write Contract”, conecta MetaMask y ejecuta funciones.

### Método 3: Integración Frontend
- Usa las direcciones en tu frontend o DApp desde `deployed-addresses-sepolia.json`.

---

## 🛠 Funcionalidades desplegadas

- **DAppToken:** Token ERC20 para recompensas, mintable por propietario.  
- **LPToken:** Token ERC20 para staking, minteable y representativo de LPs.  
- **TokenFarm:**  
  - Gestión de staking de LP tokens.  
  - Cálculo y distribución proporcional de recompensas.  
  - Sistema flexible de comisiones y recompensas por bloque.  
  - Seguridad con modifiers y validaciones robustas.

---

## 🆘 Resolución de problemas comunes

| Problema                     | Posible causa                          | Solución recomendada                      |
|-----------------------------|--------------------------------------|------------------------------------------|
| `insufficient funds`         | Saldo insuficiente en Sepolia        | Solicita ETH en faucets mencionados      |
| `invalid private key`        | Clave mal copiada o formato erróneo  | Asegúrate de copiar sin `0x` y completo |
| `network not found`          | Infura mal configurado                | Revisa tu Project ID y URL Sepolia        |
| Error en verificación        | Retraso en sincronización de Etherscan | Espera y verifica direcciones/args correctos |

---

## 🎉 ¡Felicidades!

Con este proceso tu proyecto está completamente activo, desplegado y auditado en Sepolia testnet. Ya puedes desarrollar, probar e iterar con seguridad.

---

## 📞 Soporte y ayuda

- Revisa los logs de error y consola.  
- Asegúrate de que las variables de entorno estén bien configuradas.  
- Verifica que tengas suficiente ETH para gas.  
- Consulta la documentación oficial de Hardhat y MetaMask para detalles avanzados.  
