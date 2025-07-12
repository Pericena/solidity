# 🧾 Subasta Inteligente en Solidity - Trabajo Final Módulo 2

> **Autor:** Luishiño Pericena Choque  
> **Red:** Sepolia Testnet  
> **Contrato desplegado y verificado:**  
> [Ver en Etherscan Sepolia](https://sepolia.etherscan.io/address/0x6AE072C00BFB6c87d344969E2446DEc830104510)  

---

## 🎯 Descripción del Proyecto

Este contrato implementa una **subasta segura** en la blockchain de Ethereum (Sepolia Testnet) con las siguientes características:

✔ Incremento mínimo del **5%** por oferta.  
✔ Extensión automática de 10 minutos si se oferta en los últimos 10 minutos.  
✔ Depósitos gestionados en el contrato, devolución a no ganadores.  
✔ Comisión fija del **2%** al propietario.  
✔ Reembolso parcial de excesos durante la subasta.  
✔ Contrato seguro y robusto, previene errores y ataques de reentrancia.  
✔ Código verificado públicamente en Etherscan.

---

## 🛠️ Tecnologías Utilizadas

- Solidity `^0.8.19`  
- Remix IDE  
- Metamask  
- Red Sepolia (Testnet Ethereum)  
- Etherscan Sepolia  

---

## ⚙️ Funcionalidades del Contrato

| Función                  | Descripción                                                                 |
|--------------------------|----------------------------------------------------------------------------|
| `constructor(uint minutos)` | Inicializa la subasta con la duración en minutos.                        |
| `ofertar()`              | Permite ofertar (debe ser mínimo 5% mayor que la oferta actual).           |
| `retirarReembolsoParcial()` | Permite retirar el exceso depositado, dejando la última oferta vigente.   |
| `finalizarSubasta()`     | Finaliza la subasta, devuelve fondos a no ganadores y transfiere comisión. |
| `mostrarGanador()`       | Devuelve dirección y monto del ganador actual.                             |
| `mostrarOfertas()`       | Devuelve lista completa de oferentes y sus montos.                         |

**Eventos importantes:**  
- `NuevaOferta(address, uint)` → Cuando se realiza una nueva oferta válida.  
- `SubastaFinalizada(address, uint)` → Al finalizar la subasta.  

---

## 🚀 Pasos para Desplegar el Contrato (Desde Cero)

### 1️⃣ Configuración de Metamask

- Instalar [Metamask](https://metamask.io/).  
- Crear o importar cuenta.  
- Agregar la red **Sepolia**:

```txt
Nombre: Sepolia Testnet  
RPC: https://rpc.sepolia.org  
Chain ID: 11155111  
Símbolo: ETH  
Explorador: https://sepolia.etherscan.io  
```

- Obtener ETH de prueba en https://sepoliafaucet.com/.

### Contrato desplegado:
-https://sepolia.etherscan.io/address/0x6AE072C00BFB6c87d344969E2446DEc830104510

