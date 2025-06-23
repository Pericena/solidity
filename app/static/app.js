document.addEventListener('DOMContentLoaded', async () => {
  // Elementos del DOM
  const elements = {
      connectWalletBtn: document.getElementById('connectWalletBtn'),
      walletInfo: document.getElementById('walletInfo'),
      walletAddress: document.getElementById('walletAddress'),
      walletBalance: document.getElementById('walletBalance'),
      
      ofertarBtn: document.getElementById('ofertarBtn'),
      reembolsoBtn: document.getElementById('reembolsoBtn'),
      finalizarBtn: document.getElementById('finalizarBtn'),
      montoInput: document.getElementById('monto'),
      
      minBid: document.getElementById('minBid'),
      userBalance: document.getElementById('userBalance'),
      refundAmount: document.getElementById('refundAmount'),
      auctionStatus: document.getElementById('auctionStatus'),
      contractStatus: document.getElementById('contractStatus'),
      
      transactionModal: document.getElementById('transactionModal'),
      transactionModalTitle: document.getElementById('transactionModalTitle'),
      transactionModalContent: document.getElementById('transactionModalContent'),
      transactionLoading: document.getElementById('transactionLoading'),
      transactionMessage: document.getElementById('transactionMessage'),
      transactionProgress: document.getElementById('transactionProgress'),
      transactionSuccess: document.getElementById('transactionSuccess'),
      successMessage: document.getElementById('successMessage'),
      etherscanLink: document.getElementById('etherscanLink'),
      transactionError: document.getElementById('transactionError'),
      errorMessage: document.getElementById('errorMessage'),
      errorDetail: document.getElementById('errorDetail'),
      confirmTransactionModal: document.getElementById('confirmTransactionModal'),
      closeTransactionModal: document.getElementById('closeTransactionModal')
  };

  let web3;
  let contract;
  let accounts = [];
  let isOwner = false;
  let currentHighestBid = {{ monto if monto else 0 }};

  // Inicializar Web3 y contrato
  async function initWeb3() {
      if (window.ethereum) {
          try {
              web3 = new Web3(window.ethereum);
              
              // Solicitar conexión a la wallet
              accounts = await ethereum.request({ method: 'eth_requestAccounts' });
              updateWalletInfo();
              
              // Inicializar contrato
              contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
              
              // Verificar si el usuario es el propietario
              const owner = await contract.methods.propietario().call();
              isOwner = owner.toLowerCase() === accounts[0].toLowerCase();
              elements.finalizarBtn.disabled = !isOwner;
              
              // Escuchar cambios de cuenta
              window.ethereum.on('accountsChanged', (newAccounts) => {
                  accounts = newAccounts;
                  updateWalletInfo();
                  checkRefundAmount();
              });
              
              // Escuchar cambios de red
              window.ethereum.on('chainChanged', () => {
                  window.location.reload();
              });
              
              // Cargar datos iniciales
              await loadInitialData();
              
              return true;
          } catch (error) {
              showTransactionError('Error de conexión', 'No se pudo conectar con MetaMask');
              return false;
          }
      } else {
          showTransactionError('MetaMask no detectado', 'Por favor instala MetaMask para participar');
          return false;
      }
  }

  // Actualizar información de la wallet
  async function updateWalletInfo() {
      if (accounts.length > 0) {
          const shortAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
          elements.walletAddress.textContent = shortAddress;
          elements.walletInfo.classList.remove('hidden');
          elements.connectWalletBtn.innerHTML = '<i class="fas fa-check-circle"></i> Conectado';
          elements.connectWalletBtn.classList.remove('bg-blue-600');
          elements.connectWalletBtn.classList.add('bg-green-600');
          
          // Obtener balance
          const balance = await web3.eth.getBalance(accounts[0]);
          const balanceEth = web3.utils.fromWei(balance, 'ether');
          elements.walletBalance.textContent = `${parseFloat(balanceEth).toFixed(4)} ETH`;
          elements.userBalance.textContent = `${parseFloat(balanceEth).toFixed(4)} ETH`;
      }
  }

  // Cargar datos iniciales del contrato
  async function loadInitialData() {
      try {
          // Calcular oferta mínima requerida (5% más que la actual)
          const minRequired = currentHighestBid * 1.05;
          elements.minBid.textContent = minRequired.toFixed(4) + ' ETH';
          
          // Verificar estado de la subasta
          const finalizada = await contract.methods.finalizada().call();
          if (finalizada) {
              elements.auctionStatus.textContent = 'Finalizada';
              elements.auctionStatus.classList.add('text-red-400');
              elements.contractStatus.textContent = 'Finalizada';
              elements.ofertarBtn.disabled = true;
              elements.finalizarBtn.disabled = true;
          } else {
              elements.auctionStatus.textContent = 'Activa';
              elements.auctionStatus.classList.add('text-green-400');
              elements.contractStatus.textContent = 'Activa';
          }
          
          // Verificar reembolsos disponibles
          await checkRefundAmount();
          
      } catch (error) {
          console.error('Error al cargar datos:', error);
      }
  }

  // Verificar reembolsos disponibles
  async function checkRefundAmount() {
      if (accounts.length > 0) {
          try {
              const depositoTotal = await contract.methods.depositosTotales(accounts[0]).call();
              const ultimaOferta = await contract.methods.ultimaOferta(accounts[0]).call();
              
              const depositoTotalEth = web3.utils.fromWei(depositoTotal, 'ether');
              const ultimaOfertaEth = web3.utils.fromWei(ultimaOferta, 'ether');
              
              const refund = parseFloat(depositoTotalEth) - parseFloat(ultimaOfertaEth);
              
              if (refund > 0) {
                  elements.refundAmount.textContent = refund.toFixed(4) + ' ETH';
                  elements.reembolsoBtn.disabled = false;
              } else {
                  elements.refundAmount.textContent = '0 ETH';
                  elements.reembolsoBtn.disabled = true;
              }
          } catch (error) {
              console.error('Error al verificar reembolsos:', error);
          }
      }
  }

  // Mostrar modal de transacción
  function showTransactionModal(title, message) {
      elements.transactionModalTitle.textContent = title;
      elements.transactionMessage.textContent = message;
      elements.transactionLoading.classList.remove('hidden');
      elements.transactionSuccess.classList.add('hidden');
      elements.transactionError.classList.add('hidden');
      elements.confirmTransactionModal.classList.add('hidden');
      elements.transactionModal.classList.remove('hidden');
      
      // Animación de progreso
      let progress = 0;
      const interval = setInterval(() => {
          progress += 1;
          elements.transactionProgress.style.width = `${progress}%`;
          
          if (progress >= 90) {
              clearInterval(interval);
          }
      }, 200);
  }

  // Mostrar éxito en transacción
  function showTransactionSuccess(title, message, txHash) {
      elements.transactionProgress.style.width = '100%';
      elements.transactionLoading.classList.add('hidden');
      elements.transactionSuccess.classList.remove('hidden');
      elements.successMessage.textContent = message;
      
      if (txHash) {
          elements.etherscanLink.href = `https://sepolia.etherscan.io/tx/${txHash}`;
          elements.etherscanLink.classList.remove('hidden');
      } else {
          elements.etherscanLink.classList.add('hidden');
      }
      
      elements.confirmTransactionModal.classList.remove('hidden');
  }

  // Mostrar error en transacción
  function showTransactionError(title, message, errorDetail = '') {
      elements.transactionModalTitle.textContent = title;
      elements.transactionLoading.classList.add('hidden');
      elements.transactionError.classList.remove('hidden');
      elements.errorMessage.textContent = message;
      elements.errorDetail.textContent = errorDetail;
      elements.confirmTransactionModal.classList.remove('hidden');
      elements.transactionModal.classList.remove('hidden');
  }

  // Event Listeners
  elements.connectWalletBtn.addEventListener('click', initWeb3);
  
  elements.ofertarBtn.addEventListener('click', async () => {
      if (!await initWeb3()) return;

      const montoEth = elements.montoInput.value;
      if (!montoEth || isNaN(montoEth) || parseFloat(montoEth) <= 0) {
          showTransactionError('Error', 'Ingresa un monto válido en ETH');
          return;
      }

      // Verificar que la oferta sea suficiente
      const minRequired = currentHighestBid * 1.05;
      if (parseFloat(montoEth) < minRequired) {
          showTransactionError('Oferta insuficiente', `Debes ofertar al menos ${minRequired.toFixed(4)} ETH (5% más que la oferta actual)`);
          return;
      }

      try {
          const montoWei = web3.utils.toWei(montoEth, 'ether');
          
          showTransactionModal('Confirmar Oferta', 'Confirma la transacción en MetaMask...');
          
          const tx = await contract.methods.ofertar().send({
              from: accounts[0],
              value: montoWei
          });
          
          showTransactionSuccess('Oferta Exitosa', 'Tu oferta fue registrada correctamente!', tx.transactionHash);
          
      } catch (error) {
          console.error('Error en oferta:', error);
          
          let errorMsg = 'Error al realizar la oferta';
          if (error.message.includes('revert')) {
              errorMsg = error.message.split('revert ')[1];
          } else if (error.code === 4001) {
              errorMsg = 'Transacción cancelada por el usuario';
          }
          
          showTransactionError('Error en Oferta', errorMsg, error.message);
      }
  });

  elements.reembolsoBtn.addEventListener('click', async () => {
      if (!await initWeb3()) return;

      try {
          showTransactionModal('Solicitar Reembolso', 'Procesando tu solicitud de reembolso...');
          
          const tx = await contract.methods.retirarReembolsoParcial().send({
              from: accounts[0]
          });
          
          showTransactionSuccess('Reembolso Exitoso', 'Los fondos fueron devueltos a tu wallet!', tx.transactionHash);
          
      } catch (error) {
          console.error('Error en reembolso:', error);
          
          let errorMsg = 'Error al procesar reembolso';
          if (error.message.includes('revert')) {
              errorMsg = error.message.split('revert ')[1];
          } else if (error.code === 4001) {
              errorMsg = 'Transacción cancelada por el usuario';
          }
          
          showTransactionError('Error en Reembolso', errorMsg, error.message);
      }
  });

  elements.finalizarBtn.addEventListener('click', async () => {
      if (!await initWeb3()) return;

      try {
          showTransactionModal('Finalizar Subasta', 'Confirmando finalización de la subasta...');
          
          const tx = await contract.methods.finalizarSubasta().send({
              from: accounts[0]
          });
          
          showTransactionSuccess('Subasta Finalizada', 'La subasta ha sido cerrada correctamente!', tx.transactionHash);
          
      } catch (error) {
          console.error('Error al finalizar:', error);
          
          let errorMsg = 'Error al finalizar subasta';
          if (error.message.includes('revert')) {
              errorMsg = error.message.split('revert ')[1];
          } else if (error.code === 4001) {
              errorMsg = 'Transacción cancelada por el usuario';
          }
          
          showTransactionError('Error al Finalizar', errorMsg, error.message);
      }
  });

  // Cerrar modal
  elements.closeTransactionModal.addEventListener('click', () => {
      elements.transactionModal.classList.add('hidden');
  });
  
  elements.confirmTransactionModal.addEventListener('click', () => {
      elements.transactionModal.classList.add('hidden');
      window.location.reload();
  });

  // Inicialización automática si ya está conectado
  if (window.ethereum && window.ethereum.selectedAddress) {
      initWeb3();
  }
}); 