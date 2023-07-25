const pool = require('../connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const senhaToken = require('../apiKey');

async function login(req, res) {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(404).json({ mensagem: 'Email e senha são obrigatórios.' })
    }

    try {
        const validarUsuario = await pool.query('select * from usuarios where email = $1', [email]);
        if (validarUsuario.rowCount < 1) {
            return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
        }
        const validarSenha = await bcrypt.compare(senha, validarUsuario.rows[0].senha);
        if (!validarSenha) {
            return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign({ id: validarUsuario.rows[0].id }, senhaToken, { expiresIn: '8h' });

        const { senha: _, ...usuarioLogado } = validarUsuario.rows[0];

        return res.status(200).json({ usuarioLogado, token });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

async function cadastrarUsuario(req, res) {
    const { nome, email, senha } = req.body
    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: "Os campos nome, email e senha são obrigatórios" })
    }
    if (!email.includes('@')) {
        return res.status(400).json({ mensagem: 'Email inválido!' })
    }
    try {
        const verificarEmail = await pool.query('select * from usuarios where email = $1', [email]);
        if (verificarEmail.rowCount > 0) {
            return res.status(400).json({ mensagem: 'Email já cadastrado.' })
        }
        const criptografiaSenha = await bcrypt.hash(senha, 10);
        const query = 'insert into usuarios (nome, email, senha) values ($1 , $2 , $3) returning *'

        const novoUsuario = await pool.query(query, [nome, email, criptografiaSenha])
        return res.status(201).json(novoUsuario.rows[0])
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

async function detalharUsuario(req, res) {
    const { id } = req.usuario;

    try {
        const query = 'select * from usuarios where id = $1'

        const detalhar = await pool.query(query, [id])

        if (detalhar.rows.length < 1) {
            return res.status(404).json({ mensagem: 'usuário não cadastrado.' })
        }
        return res.status(200).json(detalhar.rows)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

async function atualizarUsuario(req, res) {
    const { nome, email, senha } = req.body;
    const { id } = req.usuario;

    try {
        const queryId = 'select * from usuarios where id = $1';
        const verificarId = await pool.query(queryId, [id]);

        if (verificarId.rows.length < 1) {
            return res.status(404).json({ mensagem: 'usuário não cadastrado.' })
        }
        const criptografiaSenha = await bcrypt.hash(senha, 10);
        const query = 'update usuarios set nome = $1, email = $2, senha = $3 where id = $4';

        const atualizar = await pool.query(query, [nome, email, criptografiaSenha, id])
        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: "Os campos nome, email e senha são obrigatórios" })
        }
        if (!email.includes('@')) {
            res.status(400).json({ mensagem: 'Email inválido!' })
        }
        return res.status(201).json(atualizar.rows[0])
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

module.exports = {
    login,
    cadastrarUsuario,
    detalharUsuario,
    atualizarUsuario,
}