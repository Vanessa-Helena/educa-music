import 'dotenv/config'; 
require('dotenv').config();
import express from 'express';
import cors from 'cors';
const axios = require('axios');
const https = require('https');
const NodeCache = require('node-cache');
const apiKey = process.env.DEEPSEEK_API_KEY;
import { pipeline } from '@xenova/transformers';
import { createProxyMiddleware } from 'http-proxy-middleware'; // Mantenha essa linha
import expressRateLimit from 'express-rate-limit'; // Adicione isso
import { require } from '../esm-loader.js';

// Force ES Module implementation
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import axios desta forma
import axios from 'axios';

// Configurações iniciais
const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache de 1 hora
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-0cbd9c862e73496693fa41c26db36196';

if (!process.env.DEEPSEEK_API_KEY) {
  console.error('❌ Erro: DEEPSEEK_API_KEY não definida');
  process.exit(1);
}

// Configuração avançada do Axios
const axiosInstance = axios.create({
  baseURL: DEEPSEEK_API_URL,
  timeout: 30000, // 30 segundos de timeout
  httpsAgent: new https.Agent({
    keepAlive: true,
    rejectUnauthorized: false, // Para contornar problemas de certificado
    secureOptions: require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1
  }),
  headers: {
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json'
  }
});

// Configure proxy se necessário
if (process.env.HTTP_PROXY) {
  const HttpsProxyAgent = require('https-proxy-agent');
  axiosInstance.defaults.httpsAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
}

// Interceptor de retry automático
axiosInstance.interceptors.response.use(null, async (error) => {
  const config = error.config;
  if (!config || !config.retry) return Promise.reject(error);
  
  config.__retryCount = config.__retryCount || 0;
  if (config.__retryCount >= config.retry) {
    return Promise.reject(error);
  }
  
  config.__retryCount += 1;
  await new Promise(resolve => setTimeout(resolve, 1000 * config.__retryCount));
  
  return axiosInstance(config);
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Estatísticas de monitoramento
const stats = {
  requests: 0,
  successes: 0,
  failures: 0,
  lastError: null,
  cacheHits: 0
};

// Interceptores de monitoramento
axiosInstance.interceptors.request.use(config => {
  stats.requests++;
  console.log(`[${new Date().toISOString()}] Request to: ${config.url}`);
  return config;
});

axiosInstance.interceptors.response.use(
  response => {
    stats.successes++;
    return response;
  },
  error => {
    stats.failures++;
    stats.lastError = new Date();
    console.error(`[${new Date().toISOString()}] API Error:`, {
      code: error.code,
      message: error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

// Modelo local de fallback (leve)
let localModel;
async function loadLocalModel() {
  try {
    localModel = await pipeline('text-generation', 'Xenova/distilgpt2'); // Modelo compatível
    console.log('Modelo local carregado com sucesso');
  } catch (error) {
    console.error('Erro ao carregar modelo local:', error);
  }
}
loadLocalModel();

// Rotas da API
app.post('/api/gerar-descricao', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt é obrigatório' });

    const cacheKey = `desc_${hashString(prompt)}`;
    const cached = cache.get(cacheKey);
    if (cached && process.env.CACHE_ENABLED === 'true') {
      stats.cacheHits++;
      return res.json(cached);
    }

    const response = await axiosInstance.post('/chat/completions', {
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "Você é um assistente especializado em criar descrições acessíveis de conteúdos musicais."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 600
    }, { 
      headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      retry: 3 // 3 tentativas
    });

    const result = {
      descricao: response.data.choices[0].message.content,
      source: 'deepseek-api'
    };

    cache.set(cacheKey, result);
    res.json(result);

  } catch (error) {
    console.error('Erro detalhado:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Fallback para modelo local
    if (localModel && error.code === 'ECONNRESET') {
      try {
        const localResponse = await localModel(req.body.prompt, { max_length: 200 });
        const result = {
          descricao: localResponse[0].generated_text,
          source: 'local-model'
        };
        return res.json(result);
      } catch (localError) {
        console.error('Erro no modelo local:', localError);
      }
    }

    res.status(500).json({ 
      error: 'Erro ao processar sua solicitação',
      details: error.response?.data || error.message,
      suggestion: 'Tente novamente mais tarde'
    });
  }
});

app.post('/api/gerar-letra', async (req, res) => {
  try {
    const { tema, estilo } = req.body;
    if (!tema) return res.status(400).json({ error: 'Tema é obrigatório' });

    const cacheKey = `letra_${tema}_${estilo || 'default'}`;
    const cached = cache.get(cacheKey);
    if (cached && process.env.CACHE_ENABLED === 'true') {
      stats.cacheHits++;
      return res.json(cached);
    }

    const response = await axiosInstance.post('/chat/completions', {
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "Você é um compositor especializado em músicas educativas para crianças."
        },
        { 
          role: "user", 
          content: `Crie uma música educativa sobre ${tema} no estilo ${estilo || 'infantil'}.` 
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    }, { 
      headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      retry: 3
    });

    const result = {
      letra: response.data.choices[0].message.content,
      source: 'deepseek-api'
    };

    cache.set(cacheKey, result);
    res.json(result);

  } catch (error) {
    console.error('Erro detalhado:', error);

    // Fallback para modelo local
    if (localModel && error.code === 'ECONNRESET') {
      try {
        const prompt = `Crie uma letra de música sobre ${req.body.tema} no estilo ${req.body.estilo || 'infantil'}`;
        const localResponse = await localModel(prompt, { max_length: 300 });
        const result = {
          letra: localResponse[0].generated_text,
          source: 'local-model'
        };
        return res.json(result);
      } catch (localError) {
        console.error('Erro no modelo local:', localError);
      }
    }

    res.status(500).json({ 
      error: 'Erro ao processar sua solicitação',
      details: error.response?.data || error.message
    });
  }
});

// Rotas auxiliares
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    status: process.env.DEEPSEEK_API_KEY ? 'ok' : 'erro',
    apiConfigured: !!process.env.DEEPSEEK_API_KEY,
    environment: process.env.NODE_ENV
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    ...stats,
    lastError: stats.lastError?.toISOString(),
    memoryUsage: process.memoryUsage(),
    cacheStats: cache.getStats()
  });
});

// Função utilitária para hash simples
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'production'}`);
  console.log(`DeepSeek API: ${process.env.DEEPSEEK_API_KEY ? 'configurada' : 'não configurada'}`);
  console.log(`Cache: ${process.env.CACHE_ENABLED === 'true' ? 'ativado' : 'desativado'}`);
});

// Teste inicial de conexão
async function testInitialConnection() {
  try {
    const ping = await axiosInstance.get('/models', {
      timeout: 5000,
      validateStatus: () => true,
      headers: process.env.DEEPSEEK_API_KEY ? {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      } : {}
    });
    console.log(`Teste de conexão com a API: Status ${ping.status}`);
  } catch (error) {
    console.error('Falha no teste de conexão inicial:', {
      code: error.code,
      message: error.message
    });
  }
}

testInitialConnection();
