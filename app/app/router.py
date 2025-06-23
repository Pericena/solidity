from flask import render_template
from app import app
from app.contracts import ContractManager

@app.route('/')
def index():
    contract_manager = ContractManager()
    contract_data = contract_manager.get_contract_data()
    
    return render_template('index.html',
                         contrato=app.config['CONTRACT_ADDRESS'],
                         abi=contract_manager.abi,
                         **contract_data)