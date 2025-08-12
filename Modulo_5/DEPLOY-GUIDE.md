# 🚀 GUÍA DE DESPLIEGUE LOCAL - SIMPLE DEFI FARM

Para desplegar y usar los contratos localmente, sigue estos pasos:

---

## 📋 Requisitos previos
- Node.js instalado  
- NPM o Yarn  
- Git (opcional)  

---

## 🔧 Instalación
```bash
npm install
npx hardhat compile
```

---

## 🌐 Despliegue local

### Paso 1: Iniciar nodo local
Ejecuta en una terminal:
```bash
npm run node
```
Esto iniciará un nodo Hardhat local en `http://127.0.0.1:8545`  
**¡Deja esta terminal abierta!**

### Paso 2: Desplegar contratos
En otra terminal, ejecuta:
```bash
npm run deploy:local
```
Se desplegarán:  
- DAppToken (token de recompensas)  
- LPToken (token para staking)  
- TokenFarm (contrato principal)  

### Paso 3: Probar interacción (opcional)
```bash
npm run interact
```
Ejecuta un ejemplo completo de staking y recompensas.

---

## 🧪 Comandos útiles
| Comando             | Descripción                            |
|---------------------|--------------------------------------|
| `npm run test`      | Ejecutar todas las pruebas            |
| `npm run test:farm` | Ejecutar solo pruebas de TokenFarm    |
| `npm run console`   | Consola interactiva de Hardhat        |
| `npm run compile`   | Compilar contratos                    |
| `npm run clean`     | Limpiar artifacts                     |

---

## 🔗 Después del despliegue

Las direcciones de los contratos quedan guardadas en:  
`deployed-addresses.json`

Puedes usar estas direcciones para:  
- Conectar desde frontend (React, Vue, etc.)  
- Interactuar desde scripts personalizados  
- Usar en consola de Hardhat  

---

## 📱 Conectar MetaMask (opcional)

1. Añade una red personalizada en MetaMask:  
   - Nombre: Hardhat Local  
   - RPC URL: `http://127.0.0.1:8545`  
   - Chain ID: `31337`  
   - Símbolo: `ETH`  

2. Importa alguna cuenta de prueba:  
   - Las cuentas se muestran en la terminal cuando ejecutas `npm run node`

---

## 🆘 Solución de problemas comunes

| Problema            | Solución recomendada                              |
|---------------------|--------------------------------------------------|
| Error de compilación | Ejecuta `npm run clean && npm run compile`       |
| Error de red        | Asegúrate que el nodo local esté corriendo       |
| Error de gas        | Reinicia el nodo (Ctrl+C y luego `npm run node`) |

---

## 🎯 Funcionalidades implementadas

- ✅ Staking de LP tokens  
- ✅ Recompensas proporcionales  
- ✅ Modificadores de seguridad (`onlyOwner`, etc.)  
- ✅ Struct para información de usuarios  
- ✅ Recompensas variables por bloque  
- ✅ Sistema de comisiones (fees)  
- ✅ Pruebas completas  

---

## 💡 Ejemplo rápido de uso

- Terminal 1:  
  ```bash
  npm run node
  ```
- Terminal 2:  
  ```bash
  npm run deploy:local
  ```
- Terminal 3:  
  ```bash
  npm run interact
  ```

¡Listo para usar tu Simple DeFi Farm localmente! 🌾
