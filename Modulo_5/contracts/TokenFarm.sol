// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./DappToken.sol";
import "./LPToken.sol";

/**
 * @title Proportional Token Farm
 * @notice Una granja de staking donde las recompensas se distribuyen proporcionalmente al total stakeado.
 */
contract TokenFarm {
    //
    // Struct
    //
    struct UserInfo {
        uint256 stakingBalance;
        uint256 checkpoints;
        uint256 pendingRewards;
        bool hasStaked;
        bool isStaking;
    }

    //
    // Variables de estado
    //
    string public name = "Proportional Token Farm";
    address public owner;
    DAppToken public dappToken;
    LPToken public lpToken;

    uint256 public rewardPerBlock = 1e18; // Recompensa por bloque (variable, puede ser modificada por el owner)
    uint256 public constant MIN_REWARD_PER_BLOCK = 1e17; // Recompensa mínima por bloque (0.1 tokens)
    uint256 public constant MAX_REWARD_PER_BLOCK = 10e18; // Recompensa máxima por bloque (10 tokens)
    uint256 public totalStakingBalance; // Total de tokens en staking
    
    // Variables para comisiones
    uint256 public feePercentage = 500; // Comisión del 5% (500 / 10000 = 0.05)
    uint256 public constant MAX_FEE_PERCENTAGE = 1000; // Comisión máxima del 10% (1000 / 10000 = 0.10)
    uint256 public constant FEE_DENOMINATOR = 10000; // Denominador para cálculos de porcentaje
    uint256 public collectedFees; // Total de comisiones recolectadas

    address[] public stakers;
    mapping(address => UserInfo) public userInfo;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyStaker() {
        require(userInfo[msg.sender].isStaking, "Only staking users can call this function");
        _;
    }

    // Eventos
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 fee);
    event RewardsDistributed();
    event RewardPerBlockUpdated(uint256 oldReward, uint256 newReward);
    event FeePercentageUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    // Constructor
    constructor(DAppToken _dappToken, LPToken _lpToken) {
        // Configurar las instancias de los contratos de DappToken y LPToken.
        dappToken = _dappToken;
        lpToken = _lpToken;
        // Configurar al owner del contrato como el creador de este contrato.
        owner = msg.sender;
    }

    /**
     * @notice Calcula y distribuye las recompensas proporcionalmente al staking total.
     * @dev La función toma en cuenta el porcentaje de tokens que cada usuario tiene en staking con respecto
     *      al total de tokens en staking (`totalStakingBalance`).
     *
     * Funcionamiento:
     * 1. Se calcula la cantidad de bloques transcurridos desde el último checkpoint del usuario.
     * 2. Se calcula la participación proporcional del usuario:
     *    share = stakingBalance[beneficiary] / totalStakingBalance
     * 3. Las recompensas para el usuario se determinan multiplicando su participación proporcional
     *    por las recompensas por bloque (`rewardPerBlock`) y los bloques transcurridos:
     *    reward = rewardPerBlock * blocksPassed * share
     * 4. Se acumulan las recompensas calculadas en `pendingRewards[beneficiary]`.
     * 5. Se actualiza el checkpoint del usuario al bloque actual.
     *
     * Ejemplo Práctico:
     * - Supongamos que:
     *    Usuario A ha stakeado 100 tokens.
     *    Usuario B ha stakeado 300 tokens.
     *    Total de staking (`totalStakingBalance`) = 400 tokens.
     *    `rewardPerBlock` = 1e18 (1 token total por bloque).
     *    Han transcurrido 10 bloques desde el último checkpoint.
     *
     * Cálculo:
     * - Participación de Usuario A:
     *   shareA = 100 / 400 = 0.25 (25%)
     *   rewardA = 1e18 * 10 * 0.25 = 2.5e18 (2.5 tokens).
     *
     * - Participación de Usuario B:
     *   shareB = 300 / 400 = 0.75 (75%)
     *   rewardB = 1e18 * 10 * 0.75 = 7.5e18 (7.5 tokens).
     *
     * Resultado:
     * - Usuario A acumula 2.5e18 en `pendingRewards`.
     * - Usuario B acumula 7.5e18 en `pendingRewards`.
     *
     * Nota:
     * Este sistema asegura que las recompensas se distribuyan proporcionalmente y de manera justa
     * entre todos los usuarios en función de su contribución al staking total.
     * El propietario puede ajustar `rewardPerBlock` dentro del rango permitido para controlar
     * la emisión de recompensas.
     */
    function distributeRewards(address beneficiary) private {
        // Obtener el último checkpoint del usuario desde userInfo.
        uint256 lastCheckpoint = userInfo[beneficiary].checkpoints;
        
        // Verificar que el número de bloque actual sea mayor al checkpoint y que totalStakingBalance sea mayor a 0.
        if (block.number <= lastCheckpoint || totalStakingBalance == 0) {
            return;
        }
        
        // Calcular la cantidad de bloques transcurridos desde el último checkpoint.
        uint256 blocksPassed = block.number - lastCheckpoint;
        
        // Calcular la proporción del staking del usuario en relación al total staking (userInfo[beneficiary].stakingBalance / totalStakingBalance).
        uint256 userStakingBalance = userInfo[beneficiary].stakingBalance;
        if (userStakingBalance == 0) {
            userInfo[beneficiary].checkpoints = block.number;
            return;
        }
        
        // Calcular las recompensas del usuario multiplicando la proporción por rewardPerBlock y los bloques transcurridos.
        uint256 userReward = (rewardPerBlock * blocksPassed * userStakingBalance) / totalStakingBalance;
        
        // Actualizar las recompensas pendientes del usuario en userInfo.
        userInfo[beneficiary].pendingRewards += userReward;
        
        // Actualizar el checkpoint del usuario al bloque actual.
        userInfo[beneficiary].checkpoints = block.number;
    }

    /**
     * @notice Deposita tokens LP para staking.
     * @param _amount Cantidad de tokens LP a depositar.
     */
    function deposit(uint256 _amount) external {
        // Verificar que _amount sea mayor a 0.
        require(_amount > 0, "Amount must be greater than 0");
        
        // Transferir tokens LP del usuario a este contrato.
        lpToken.transferFrom(msg.sender, address(this), _amount);
        
        // Actualizar el balance de staking del usuario en userInfo.
        userInfo[msg.sender].stakingBalance += _amount;
        
        // Incrementar totalStakingBalance con _amount.
        totalStakingBalance += _amount;
        
        // Si el usuario nunca ha hecho staking antes, agregarlo al array stakers y marcar hasStaked como true.
        if (!userInfo[msg.sender].hasStaked) {
            stakers.push(msg.sender);
            userInfo[msg.sender].hasStaked = true;
        }
        
        // Actualizar isStaking del usuario a true.
        userInfo[msg.sender].isStaking = true;
        
        // Si checkpoints del usuario está vacío, inicializarlo con el número de bloque actual.
        if (userInfo[msg.sender].checkpoints == 0) {
            userInfo[msg.sender].checkpoints = block.number;
        }
        
        // Llamar a distributeRewards para calcular y actualizar las recompensas pendientes.
        distributeRewards(msg.sender);
        
        // Emitir un evento de depósito.
        emit Deposit(msg.sender, _amount);
    }

    /**
     * @notice Retira todos los tokens LP en staking.
     */
    function withdraw() external onlyStaker {
        // Obtener el balance de staking del usuario.
        uint256 balance = userInfo[msg.sender].stakingBalance;
        
        // Verificar que el balance de staking sea mayor a 0.
        require(balance > 0, "Staking balance is 0");
        
        // Llamar a distributeRewards para calcular y actualizar las recompensas pendientes antes de restablecer el balance.
        distributeRewards(msg.sender);
        
        // Restablecer stakingBalance del usuario a 0.
        userInfo[msg.sender].stakingBalance = 0;
        
        // Reducir totalStakingBalance en el balance que se está retirando.
        totalStakingBalance -= balance;
        
        // Actualizar isStaking del usuario a false.
        userInfo[msg.sender].isStaking = false;
        
        // Transferir los tokens LP de vuelta al usuario.
        lpToken.transfer(msg.sender, balance);
        
        // Emitir un evento de retiro.
        emit Withdraw(msg.sender, balance);
    }

    /**
     * @notice Reclama recompensas pendientes.
     */
    function claimRewards() external {
        // Obtener el monto de recompensas pendientes del usuario desde userInfo.
        uint256 pendingAmount = userInfo[msg.sender].pendingRewards;
        
        // Verificar que el monto de recompensas pendientes sea mayor a 0.
        require(pendingAmount > 0, "No rewards to claim");
        
        // Calcular la comisión a cobrar
        uint256 fee = (pendingAmount * feePercentage) / FEE_DENOMINATOR;
        uint256 userAmount = pendingAmount - fee;
        
        // Restablecer las recompensas pendientes del usuario a 0.
        userInfo[msg.sender].pendingRewards = 0;
        
        // Acumular la comisión recolectada
        collectedFees += fee;
        
        // Llamar a la función de acuñación (mint) en el contrato DappToken para transferir las recompensas al usuario.
        dappToken.mint(msg.sender, userAmount);
        
        // Emitir un evento de reclamo de recompensas con la comisión cobrada.
        emit RewardsClaimed(msg.sender, userAmount, fee);
    }

    /**
     * @notice Distribuye recompensas a todos los usuarios en staking.
     */
    function distributeRewardsAll() external onlyOwner {
        _distributeRewardsToAllStakers();
        // Emitir un evento indicando que las recompensas han sido distribuidas.
        emit RewardsDistributed();
    }

    /**
     * @notice Función interna para distribuir recompensas a todos los stakers.
     */
    function _distributeRewardsToAllStakers() internal {
        // Iterar sobre todos los usuarios en staking almacenados en el array stakers.
        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            // Para cada usuario, si están haciendo staking (isStaking == true), llamar a distributeRewards.
            if (userInfo[staker].isStaking) {
                distributeRewards(staker);
            }
        }
    }

    /**
     * @notice Permite al propietario actualizar la recompensa por bloque.
     * @param _newRewardPerBlock Nueva recompensa por bloque (debe estar dentro del rango permitido).
     */
    function setRewardPerBlock(uint256 _newRewardPerBlock) external onlyOwner {
        // Verificar que la nueva recompensa esté dentro del rango permitido
        require(
            _newRewardPerBlock >= MIN_REWARD_PER_BLOCK && _newRewardPerBlock <= MAX_REWARD_PER_BLOCK,
            "Reward per block must be within allowed range"
        );

        // Distribuir recompensas pendientes con la tasa actual antes de cambiar
        _distributeRewardsToAllStakers();

        // Guardar el valor anterior para el evento
        uint256 oldReward = rewardPerBlock;
        
        // Actualizar la recompensa por bloque
        rewardPerBlock = _newRewardPerBlock;
        
        // Emitir evento de actualización
        emit RewardPerBlockUpdated(oldReward, _newRewardPerBlock);
    }

    /**
     * @notice Obtiene el rango de recompensas permitido.
     * @return min Recompensa mínima por bloque.
     * @return max Recompensa máxima por bloque.
     */
    function getRewardRange() external pure returns (uint256 min, uint256 max) {
        return (MIN_REWARD_PER_BLOCK, MAX_REWARD_PER_BLOCK);
    }

    /**
     * @notice Permite al propietario actualizar el porcentaje de comisión.
     * @param _newFeePercentage Nuevo porcentaje de comisión (en puntos básicos, ej: 500 = 5%).
     */
    function setFeePercentage(uint256 _newFeePercentage) external onlyOwner {
        // Verificar que el nuevo porcentaje esté dentro del límite permitido
        require(_newFeePercentage <= MAX_FEE_PERCENTAGE, "Fee percentage exceeds maximum allowed");

        // Guardar el valor anterior para el evento
        uint256 oldFee = feePercentage;
        
        // Actualizar el porcentaje de comisión
        feePercentage = _newFeePercentage;
        
        // Emitir evento de actualización
        emit FeePercentageUpdated(oldFee, _newFeePercentage);
    }

    /**
     * @notice Permite al propietario retirar las comisiones acumuladas.
     */
    function withdrawFees() external onlyOwner {
        // Verificar que haya comisiones para retirar
        require(collectedFees > 0, "No fees to withdraw");

        // Guardar el monto a retirar
        uint256 feesToWithdraw = collectedFees;
        
        // Restablecer las comisiones acumuladas a 0
        collectedFees = 0;
        
        // Mint de los tokens de comisión al propietario
        dappToken.mint(owner, feesToWithdraw);
        
        // Emitir evento de retiro de comisiones
        emit FeesWithdrawn(owner, feesToWithdraw);
    }

    /**
     * @notice Obtiene información sobre las comisiones.
     * @return currentFee Porcentaje actual de comisión.
     * @return maxFee Porcentaje máximo permitido de comisión.
     * @return accumulated Comisiones acumuladas pendientes de retiro.
     */
    function getFeeInfo() external view returns (uint256 currentFee, uint256 maxFee, uint256 accumulated) {
        return (feePercentage, MAX_FEE_PERCENTAGE, collectedFees);
    }

    /**
     * @notice Calcula la comisión que se cobraría por una cantidad de recompensas.
     * @param _rewardAmount Cantidad de recompensas a evaluar.
     * @return fee Comisión que se cobraría.
     * @return netAmount Cantidad neta que recibiría el usuario después de la comisión.
     */
    function calculateFee(uint256 _rewardAmount) external view returns (uint256 fee, uint256 netAmount) {
        fee = (_rewardAmount * feePercentage) / FEE_DENOMINATOR;
        netAmount = _rewardAmount - fee;
        return (fee, netAmount);
    }
}