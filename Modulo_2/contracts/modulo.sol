// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Subasta Inteligente Segura con Reembolsos y Comisión
/// @author Luishiño
/// @notice Permite subastas con incremento mínimo del 5%, extensión automática, reembolsos y comisión al propietario.

contract Subasta {
    address payable public propietario;
    uint public tiempoFinalizacion;
    uint public ofertaGanadora;
    address public ganador;
    uint public constanteComision = 2; // Comisión fija del 2% al propietario

    struct Oferta {
        address oferente;
        uint monto;
    }

    Oferta[] public ofertas;
    mapping(address => uint) public depositosTotales;
    mapping(address => uint) public ultimaOferta;

    bool public finalizada;

    event NuevaOferta(address indexed oferente, uint monto);
    event SubastaFinalizada(address ganador, uint monto);

    /// @param _duracionMinutos Duración inicial de la subasta en minutos
    constructor(uint _duracionMinutos) {
        require(_duracionMinutos > 0, "Duracion debe ser positiva");
        propietario = payable(msg.sender);
        tiempoFinalizacion = block.timestamp + (_duracionMinutos * 1 minutes);
    }

    /// Restringe funciones solo si la subasta sigue activa
    modifier soloMientrasActiva() {
        require(block.timestamp < tiempoFinalizacion, "La subasta finalizo");
        require(!finalizada, "La subasta ya fue finalizada");
        _;
    }

    /// Restringe funciones solo al propietario
    modifier soloPropietario() {
        require(msg.sender == propietario, "Solo el propietario puede ejecutar esto");
        _;
    }

    /// @notice Realiza una oferta válida
    function ofertar() external payable soloMientrasActiva {
        require(msg.value > 0, "Debes enviar ETH");

        uint minimoRequerido = ofertaGanadora + (ofertaGanadora * 5) / 100;
        require(msg.value > minimoRequerido, "Oferta debe ser al menos 5% mayor que la actual");

        depositosTotales[msg.sender] += msg.value;
        ultimaOferta[msg.sender] = msg.value;

        ofertas.push(Oferta(msg.sender, msg.value));
        ofertaGanadora = msg.value;
        ganador = msg.sender;

        // Extiende la subasta si quedan menos de 10 minutos
        if (tiempoFinalizacion - block.timestamp < 10 minutes) {
            tiempoFinalizacion += 10 minutes;
        }

        emit NuevaOferta(msg.sender, msg.value);
    }

    /// @notice Permite al oferente retirar el exceso depositado durante la subasta
    function retirarReembolsoParcial() external soloMientrasActiva {
        uint exceso = depositosTotales[msg.sender] - ultimaOferta[msg.sender];
        require(exceso > 0, "No hay reembolso disponible");

        depositosTotales[msg.sender] -= exceso;

        (bool success, ) = payable(msg.sender).call{value: exceso}("");
        require(success, "Error al transferir reembolso");
    }

    /// @notice Finaliza la subasta y distribuye los fondos
    function finalizarSubasta() external soloPropietario {
        require(block.timestamp >= tiempoFinalizacion, "La subasta sigue activa");
        require(!finalizada, "Subasta ya finalizada");

        finalizada = true;

        uint montoGanador = ofertaGanadora;
        uint comisionMonto = (montoGanador * constanteComision) / 100;
        uint montoPropietario = montoGanador - comisionMonto;

        // Transferencia segura al propietario
        (bool successPropietario, ) = propietario.call{value: montoPropietario}("");
        require(successPropietario, "Error al transferir al propietario");

        // Reembolso a los participantes no ganadores
        for (uint i = 0; i < ofertas.length; i++) {
            address oferente = ofertas[i].oferente;
            if (oferente != ganador && depositosTotales[oferente] > 0) {
                uint reembolso = depositosTotales[oferente];
                depositosTotales[oferente] = 0;

                (bool successReembolso, ) = payable(oferente).call{value: reembolso}("");
                require(successReembolso, "Error al devolver reembolso");
            }
        }

        emit SubastaFinalizada(ganador, montoGanador);
    }

    /// @notice Muestra al ganador actual y su oferta
    function mostrarGanador() external view returns (address, uint) {
        return (ganador, ofertaGanadora);
    }

    /// @notice Retorna la lista de todas las ofertas
    function mostrarOfertas() external view returns (Oferta[] memory) {
        return ofertas;
    }
}
