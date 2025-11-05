-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS extrato_sh;

-- PESSOA table
CREATE TABLE IF NOT EXISTS extrato_sh.pessoa (
    id BIGSERIAL PRIMARY KEY,
    contato VARCHAR(255) UNIQUE NOT NULL,
    primeiro_nome VARCHAR(100) NOT NULL,
    numero_magico VARCHAR(16) UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pessoa_primeiro_nome_numero_magico
    ON extrato_sh.pessoa (primeiro_nome, numero_magico);

-- LANCAMENTO table
CREATE TABLE IF NOT EXISTS extrato_sh.lancamento (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    data_prevista DATE NOT NULL,
    data_efetiva DATE NULL,
    venc_fatura DATE NULL,
    valor_previsto NUMERIC(10,2) NOT NULL,
    valor_efetivo NUMERIC(10,2) NULL,
    descricao VARCHAR(500) NULL,
    categoria VARCHAR(255) NULL,
    subcategoria VARCHAR(255) NULL,
    conta VARCHAR(255) NOT NULL,
    conta_transferencia VARCHAR(255) NULL,
    centro VARCHAR(255) NULL,
    contato VARCHAR(255) NOT NULL,
    forma VARCHAR(255) NOT NULL,
    projeto VARCHAR(255) NOT NULL,
    n_documento VARCHAR(255) NULL,
    observacoes VARCHAR(500) NULL,
    data_competencia DATE NULL,
    id_unico VARCHAR(255) NOT NULL,
    tags VARCHAR(255) NULL,
    cartao VARCHAR(255) NULL,
    repeticao VARCHAR(50) NOT NULL,
    meta_economia NUMERIC(10,2) NULL,
    data_criacao DATE NOT NULL,
    pessoa_id BIGINT NULL,
    CONSTRAINT fk_lancamento_pessoa FOREIGN KEY (pessoa_id)
        REFERENCES extrato_sh.pessoa (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lancamento_pessoa_data
    ON extrato_sh.lancamento (pessoa_id, data_efetiva, data_prevista);
