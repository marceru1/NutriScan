// Config da conexão com o backend (FastAPI) — é o ÚNICO lugar para mexer.
// Emulador Android: 10.0.2.2 (= o PC hospedeiro). Celular físico: IP do PC na rede
// (uvicorn --host 0.0.0.0). Nesta máquina de dev a porta 8000 está ocupada:
// use a porta que o uvicorn do backend rodar (ex.: 8765).
export const API_URL = 'http://10.0.2.2:8000';

// Mesma string de NUTRISCAN_API_KEY do backend (backend/.env). Deixe vazio em dev
// aberto (backend sem chave) — e o header não é enviado. A chave vai no APK:
// é porta de entrada, não cofre (ver README do backend).
export const API_KEY = '';

// false = usa os dados de demonstração (mock, sem rede). true = chama o FastAPI.
// Em build de produção deixe SEMPRE true.
export const USE_MOCK = false;
