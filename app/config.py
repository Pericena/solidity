import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    INFURA_URL = os.getenv('INFURA_URL', 'https://sepolia.infura.io/v3/key')
    CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS', '0x6AE072C00BFB6c87d344969E2446DEc830104510')
    SECRET_KEY = os.getenv('SECRET_KEY', 'hacker2025')