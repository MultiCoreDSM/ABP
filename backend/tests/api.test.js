// Jest + Supertest integration tests for ABP-1 backend API
import request from 'supertest';
import app from '../src/server.js';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate a random valid CPF (simple placeholder, not checksum)
function randomCpf() {
  const digits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10));
  return digits.join('');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let testCpf = randomCpf();
const testSenha = 'SenhaSegura123';
let token = '';

describe('Sprint 2 end‑to‑end flow', () => {
  afterAll(async () => {
    // Clean up: delete created candidate
    await pool.query('DELETE FROM candidatos WHERE cpf = $1', [testCpf]);
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
