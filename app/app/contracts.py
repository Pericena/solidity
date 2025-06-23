import json
from web3 import Web3
from app import app

class ContractManager:
    def __init__(self):
        self.web3 = Web3(Web3.HTTPProvider(app.config['INFURA_URL']))
        self.contract_address = app.config['CONTRACT_ADDRESS']
        
        with open("app/abi.json") as f:
            self.abi = json.load(f)
            
        self.contract = self.web3.eth.contract(
            address=self.contract_address,
            abi=self.abi
        )
    
    def get_contract_data(self):
        try:
            if not self.web3.is_connected():
                raise Exception("No conectado a Sepolia")

            ganador, monto_wei = self.contract.functions.mostrarGanador().call()
            monto_eth = self.web3.from_wei(monto_wei, 'ether')

            ofertas_raw = self.contract.functions.mostrarOfertas().call()
            ofertas = []
            for oferta in ofertas_raw:
                usuario = oferta[0]
                monto = self.web3.from_wei(oferta[1], 'ether')
                ofertas.append({'usuario': usuario, 'monto': monto})

            return {
                'ganador': ganador,
                'monto': monto_eth,
                'ofertas': ofertas,
                'error': None
            }
        except Exception as e:
            app.logger.error(f"Error al obtener datos del contrato: {e}")
            return {
                'ganador': "Error",
                'monto': 0,
                'ofertas': [],
                'error': str(e)
            }