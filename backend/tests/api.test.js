// Jest + Supertest integration tests for ABP-1 backend API
import request from 'supertest';
import app from '../src/server.js';
import pool from '../src/config/database.js';
import bcrypt from 'bcryptjs';

// Gerador de CPF válido matematicamente
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
let token = '';

describe('Sprint 2 end‑to‑end flow', () => {
  afterAll(async () => {
    try {
      await pool.query('DELETE FROM candidatos WHERE cpf = $1', [testCpf]);
    } catch (e) {
      // ignore
    }
    await pool.end();
  });

  test('cadastrar candidato válido', async () => {
    const res = await request(app)
      .post('/api/candidatos')
      .send({
        cpf: testCpf,
        nome: 'Teste Usuário',
        email: 'teste@example.com',
        senha: testSenha,
      })
      .set('Accept', 'application/json');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  test('cadastrar candidato duplicado devolve erro 400', async () => {
    const res = await request(app)
      .post('/api/candidatos')
      .send({
        cpf: testCpf,
        nome: 'Teste Duplicado',
        email: 'dup@example.com',
        senha: testSenha,
      })
      .set('Accept', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  test('login com credenciais corretas', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ cpf: testCpf, senha: testSenha })
      .set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  test('login com senha incorreta devolve 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ cpf: testCpf, senha: 'senhaErrada' })
      .set('Accept', 'application/json');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('erro');
  });

  test('senha armazenada como hash no BD', async () => {
    const { rows } = await pool.query('SELECT senha_hash FROM candidatos WHERE cpf = $1', [testCpf]);
    expect(rows.length).toBe(1);
    const hash = rows[0].senha_hash;
    expect(hash).not.toBe(testSenha);
    const match = await bcrypt.compare(testSenha, hash);
    expect(match).toBe(true);
  });

  test('rota protegida rejeita acesso sem token', async () => {
    const res = await request(app).get('/api/temas');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('erro');
  });

  test('rota protegida aceita token válido', async () => {
    const res = await request(app)
      .get('/api/temas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
