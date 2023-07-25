const pool = require('../connection');

async function listarCategorias(req, res) {
  try {
    const listar = await pool.query(`select * from categorias`);
    return res.status(200).json(listar.rows)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ mensagem: 'Erro interno do servidor' })
  }
}


module.exports = {
  listarCategorias,
}