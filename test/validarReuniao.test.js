import assert from "node:assert/strict";
import { test } from "node:test";
import { validarFiltros, validarReuniao } from "../utils/validarReuniao.js";

const reuniao = (alteracoes = {}) => ({
    tipo_reuniao: "mds",
    data: "2026-11-04",
    hora_inicio: "19:30",
    hora_fim: "21:15",
    tempo_total: "01:45:00",
    partes: [],
    ...alteracoes
});

const rejeita = (corpo, mensagem) =>
    assert.throws(() => validarReuniao(corpo), (erro) => erro.status === 400 && mensagem.test(erro.message));

test("monta os parâmetros de salvar_reuniao", () => {
    const parametros = validarReuniao(reuniao({
        partes: [{ chave: "discurso", tempo: "10:05", quem_fez: "Maria" }]
    }));

    assert.deepEqual(parametros, {
        p_tipo_reuniao: "mds",
        p_data: "2026-11-04",
        p_hora_inicio: "19:30",
        p_hora_fim: "21:15",
        p_tempo_total_segundos: 6300,
        p_partes: [{ chave: "discurso", duracao_segundos: 605, quem_fez: "Maria" }]
    });
});

test("ignora partes sem tempo e aceita quem_fez ausente", () => {
    const { p_partes } = validarReuniao(reuniao({
        partes: [
            { chave: "parte4", tempo: "", quem_fez: "Maria" },
            { chave: "conselho5" },
            { chave: "anuncios", tempo: "02:00" }
        ]
    }));

    assert.deepEqual(p_partes, [{ chave: "anuncios", duracao_segundos: 120, quem_fez: null }]);
});

test("rejeita campos obrigatórios inválidos", () => {
    rejeita(undefined, /tipo_reuniao/);
    rejeita(reuniao({ tipo_reuniao: "outra" }), /tipo_reuniao/);
    rejeita(reuniao({ data: "04/11/2026" }), /data/);
    rejeita(reuniao({ hora_inicio: "19h30" }), /hora_inicio/);
    rejeita(reuniao({ hora_fim: undefined }), /hora_fim/);
    rejeita(reuniao({ tempo_total: "muito" }), /tempo_total/);
    rejeita(reuniao({ partes: "discurso" }), /partes/);
});

test("rejeita partes inválidas", () => {
    rejeita(reuniao({ partes: [{ tempo: "01:00" }] }), /chave/);
    rejeita(reuniao({ partes: [null] }), /chave/);
    rejeita(reuniao({ partes: [{ chave: "discurso", tempo: "dez" }] }), /Tempo inválido/);
    rejeita(reuniao({ partes: [{ chave: "discurso", tempo: "01:00", quem_fez: 1 }] }), /quem_fez/);
    rejeita(reuniao({
        partes: [{ chave: "discurso", tempo: "01:00" }, { chave: "discurso", tempo: "02:00" }]
    }), /repetida/);
});

test("valida os filtros da listagem", () => {
    assert.deepEqual(validarFiltros({ data: "2026-11-04", tipo: "fds" }), { data: "2026-11-04", tipo: "fds" });
    assert.deepEqual(validarFiltros({}), { data: undefined, tipo: undefined });
    assert.throws(() => validarFiltros({ data: "ontem" }), /data/);
    assert.throws(() => validarFiltros({ tipo: "x" }), /tipo/);
});
