// Config da conexão com o backend (FastAPI) — é o ÚNICO lugar para mexer.
// Produção: backend no VPS (Dokploy, https + Cloudflare).
export const API_URL = 'https://api.beeorganized.com.br';

// Dev no PC + celular físico no hotspot do PC: http://<IP-do-PC>:<porta-do-uvicorn>
// (uvicorn --host 0.0.0.0). Emulador Android: http://10.0.2.2:<porta> = o PC hospedeiro.
// Dev aberto sem chave: deixe API_KEY = '' (o header não é enviado).

// Mesma string de NUTRISCAN_API_KEY do backend (agora é '123').
// Só as rotas /produtos usam; o GET de imagem é público. O admin token NUNCA vai aqui.
export const API_KEY = '123';

// false = chama o FastAPI real. true = dados de demonstração (mock, sem rede).
// Quem decide é o services/api.ts (if (USE_MOCK) → mock).
export const USE_MOCK = false;
