// Testes automatizados de integracao para o fluxo ponta a ponta (QA-01 - Sprint 2)
import request from 'supertest';
import app from '../src/server.js';
import pool from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Gerador de CPF matematicamente valido com 11 digitos numericos
function gerarCpfValido() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  let d1 = 0;
  for (let i = 0; i < 9; i++) d1 += n[i] * (10 - i);
  d1 = ((d1 * 10) % 11) % 10;
  n.push(d1);

  let d2 = 0;
  for (let i = 0; i < 10; i++) d2 += n[i] * (11 - i);
  d2 = ((d2 * 10) % 11) % 10;
  n.push(d2);

  return n.join('');
}

const testCpf = gerarCpfValido();
const testSenha = 'SenhaSegura123';
let tokenValido = '';
let candidatoCadastradoId = null;

describe('Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca)', () => {
  afterAll(async () => {
    try {
      await pool.query('DELETE FROM candidatos WHERE cpf = $1', [testCpf]);
    } catch (e) {
      // Ignora erro caso o pool ja tenha sido fechado
    }
    await pool.end();
  });

  // Atividade 1: Testar cadastro valido e CPF duplicado
  test('Atividade 1: Cadastrar candidato com dados validos', async () => {
    const res = await request(app)
      .post('/api/candidatos')
      .send({
        cpf: testCpf,
        nome: 'Usuario Teste MultiCore',
        email: 'usuario.teste@exemplo.com',
        senha: testSenha,
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('cpf', testCpf);
    expect(res.body).toHaveProperty('nome', 'Usuario Teste MultiCore');
    expect(res.body).toHaveProperty('email', 'usuario.teste@exemplo.com');
    // Seguranca: garante que nem a senha nem o hash sao devolvidos no cadastro
    expect(res.body).not.toHaveProperty('senha');
    expect(res.body).not.toHaveProperty('senha_hash');
    candidatoCadastradoId = res.body.id;
  });

  test('Atividade 1: Rejeitar tentativa de cadastro com CPF duplicado', async () => {
    const res = await request(app)
      .post('/api/candidatos')
      .send({
        cpf: testCpf,
        nome: 'Tentativa Duplicada',
        email: 'outro.email@exemplo.com',
        senha: testSenha,
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro', 'CPF já cadastrado.');
  });

  // Atividade 2: Testar login valido e credenciais incorretas
  test('Atividade 2: Autenticar com credenciais corretas', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ cpf: testCpf, senha: testSenha })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('tipo', 'Bearer');
    expect(res.body).toHaveProperty('candidato');
    // Seguranca: dados do candidato no retorno do login nao possuem senha/hash
    expect(res.body.candidato).not.toHaveProperty('senha');
    expect(res.body.candidato).not.toHaveProperty('senha_hash');
    tokenValido = res.body.token;
  });

  test('Atividade 2: Rejeitar login com credenciais incorretas (senha divergente)', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ cpf: testCpf, senha: 'senhaIncorretaErrada' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('erro', 'CPF ou senha incorretos');
  });

  // Atividade 3: Verificar hash e ausencia de senha em banco e respostas
  test('Atividade 3: Verificar que a senha foi armazenada unicamente como hash bcrypt no banco', async () => {
    const { rows } = await pool.query('SELECT senha_hash FROM candidatos WHERE cpf = $1', [testCpf]);
    expect(rows.length).toBe(1);
    const hash = rows[0].senha_hash;
    expect(hash).not.toBe(testSenha);
    expect(hash.startsWith('$2')).toBe(true); // padrao bcrypt
    const confere = await bcrypt.compare(testSenha, hash);
    expect(confere).toBe(true);
  });

  test('Atividade 3: Rota /api/candidatos/me nao deve expor senha nem hash', async () => {
    const res = await request(app)
      .get('/api/candidatos/me')
      .set('Authorization', `Bearer ${tokenValido}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('senha');
    expect(res.body).not.toHaveProperty('senha_hash');
    expect(res.body).not.toHaveProperty('cpf'); // A API protege o CPF no perfil publico/menu
  });

  // Atividade 4: Testar acesso a rota protegida sem sessao
  test('Atividade 4: Rejeitar acesso a rota protegida quando nenhum token e enviado', async () => {
    const res = await request(app).get('/api/certificacao/temas');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('erro', 'Token obrigatório');
  });

  test('Atividade 4: Rejeitar acesso a rota protegida com formato Authorization invalido', async () => {
    const res = await request(app)
      .get('/api/certificacao/temas')
      .set('Authorization', 'Basic 123456');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('erro', 'Use Authorization: Bearer TOKEN');
  });

  test('Atividade 4: Permitir acesso a rota protegida quando token valido for informado', async () => {
    const res = await request(app)
      .get('/api/certificacao/temas')
      .set('Authorization', `Bearer ${tokenValido}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Atividade 5: Testar expiracao e encerramento da sessao
  test('Atividade 5: Rejeitar token expirado com mensagem de expiracao', async () => {
    const segredo = process.env.JWT_SECRET;
    // Forja um token assinado com o mesmo segredo, porem ja expirado ha 10 segundos
    const tokenExpirado = jwt.sign(
      {},
      segredo,
      {
        subject: String(candidatoCadastradoId),
        algorithm: 'HS256',
        expiresIn: '-10s',
        issuer: 'portal-certificacao-api',
        audience: 'portal-certificacao'
      }
    );

    const res = await request(app)
      .get('/api/certificacao/temas')
      .set('Authorization', `Bearer ${tokenExpirado}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('erro', 'Token inválido ou expirado');
  });

  test('Atividade 5: Simulacao de encerramento da sessao (logout no cliente descarta token)', async () => {
    // No modelo JWT stateless utilizado pela aplicacao (conforme comum.js MultiCore.sair()),
    // o encerramento da sessao ocorre pelo descarte do token no cliente (sessionStorage.removeItem).
    // Qualquer requisicao subsequente sem o token e barrada pela API.
    const tokenDescartado = '';
    const res = await request(app)
      .get('/api/certificacao/temas')
      .set('Authorization', tokenDescartado);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('erro', 'Token obrigatório');
  });
});
