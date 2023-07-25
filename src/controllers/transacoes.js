const pool = require('../connection');

async function listarTransacao(req, res) {
    const { id } = req.usuario;
    let { orderBy } = req.query;

    if (!orderBy) {
        orderBy = 'desc'
    }

    try {
        const listar = await pool.query(`select 
        t.id, t.tipo, t.descricao, t.valor, t.data, t.usuario_id, t.categoria_id, c.descricao as categoria_nome
        from 
        transacoes t 
        join 
        categorias c
        on 
        t.categoria_id = c.id
        and
        t.usuario_id = $1
        order by
        t.data
        ${orderBy}`, [id])

        return res.status(200).json(listar.rows)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

async function detalharTransacao(req, res) {
    const { id } = req.usuario;

    try {
        const query = 'select * from transacoes where usuario_id = $1 and id= $2';
        const detalhar = await pool.query(query, [id, req.params.id]);
        if (detalhar.rowCount < 1) {
            return res.status(404).json({ mensagem: 'Transação não encontrada.' });
        }
        return res.status(200).json(detalhar.rows);
    } catch (error) {
        console.log(error)
        return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
}

async function cadastrarTransacao(req, res) {
    const { id } = req.usuario;
    const { tipo, descricao, valor, data, categoria_id } = req.body;

    if (!tipo || !descricao || !valor || !data || !categoria_id) {
        return res.status(404).json({ mensagem: 'Todos os campos obrigatórios devem ser informados.' });
    }


    try {
        const queryCategoria = await pool.query('select * from categorias where id = $1', [categoria_id]);
        if (queryCategoria.rows.length < 1) {
            return res.status(404).json({ mensagem: 'Categoria não cadastrada.' });
        }
        const query = 'insert into transacoes (tipo, descricao, valor, data, categoria_id, usuario_id ) values ($1, $2, $3, $4, $5, $6) returning *';
        const cadastrar = await pool.query(query, [tipo, descricao, (valor * 100), data, categoria_id, id]);

        return res.status(200).json(cadastrar.rows);
    } catch (error) {
        console.log(error)
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

async function atualizarTransacao(req, res) {
    const { id } = req.usuario
    const { tipo, descricao, valor, data, categoria_id } = req.body;
    if (!tipo || !descricao || !valor || !data || !categoria_id) {
        return res.status(404).json({ mensagem: 'Todos os campos obrigatórios devem ser informados.' });
    }
    try {
        const query = 'update transacoes set tipo= $1, descricao= $2, valor= $3, data= $4, categoria_id= $5 where usuario_id = $6 and id = $7';
        const atualizar = await pool.query(query, [tipo, descricao, valor, data, categoria_id, id, req.params.id]);

        return res.status(204).json(atualizar.rows[0]);
    } catch (error) {
        console.log(error)
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}

async function deletarTransacao(req, res) {
    const { id } = req.usuario;

    try {
        const query = await pool.query('delete from transacoes where id = $1 and usuario_id = $2', [req.params.id, id]);
        if (query.rowCount < 1) {
            return res.status(404).json({ mensagem: 'Transação não encontrada.' })
        }
        return res.status(204).send();
    } catch (error) {
        console.log(error)
        return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
}

async function extratoTransacao(req, res) {
    const { id } = req.usuario;

    try {
        const extratoEntrada = await pool.query('select sum(valor) as entrada from transacoes where tipo = $1 and usuario_id = $2', ['Entrada', id]);
        const extratoSaida = await pool.query('select sum(valor) as saida from transacoes where tipo = $1 and usuario_id = $2', ['Saída', id]);
        const extrato = {
            entrada: Number(extratoEntrada.rows[0].entrada) || 0,
            saida: Number(extratoSaida.rows[0].saida) || 0
        }
        return res.status(200).json(extrato)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
}


module.exports = {
    listarTransacao,
    detalharTransacao,
    cadastrarTransacao,
    atualizarTransacao,
    deletarTransacao,
    extratoTransacao,
}