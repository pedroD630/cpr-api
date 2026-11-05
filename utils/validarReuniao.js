import { ErroApi } from "./erroApi.js";
import { tempoParaSegundos } from "./tempo.js";

const TIPOS_REUNIAO = ["mds", "fds"];
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^\d{2}:\d{2}(:\d{2})?$/;

function validarPartes(partes) {
    if (!Array.isArray(partes)) {
        throw new ErroApi(400, "partes deve ser uma lista");
    }

    const chaves = new Set();
    const partesValidas = [];

    for (const parte of partes) {
        if (typeof parte?.chave !== "string" || !parte.chave) {
            throw new ErroApi(400, "Toda parte precisa de uma chave");
        }

        // Parte sem tempo não foi realizada: não gera registro.
        if (parte.tempo === undefined || parte.tempo === null || parte.tempo === "") {
            continue;
        }

        const duracao = tempoParaSegundos(parte.tempo);
        if (duracao === null) {
            throw new ErroApi(400, `Tempo inválido na parte ${parte.chave}`);
        }

        if (chaves.has(parte.chave)) {
            throw new ErroApi(400, `Parte repetida: ${parte.chave}`);
        }

        if (parte.quem_fez !== undefined && parte.quem_fez !== null && typeof parte.quem_fez !== "string") {
            throw new ErroApi(400, `quem_fez inválido na parte ${parte.chave}`);
        }

        chaves.add(parte.chave);
        partesValidas.push({
            chave: parte.chave,
            duracao_segundos: duracao,
            quem_fez: parte.quem_fez ?? null
        });
    }

    return partesValidas;
}

// Valida o corpo do POST e devolve os parâmetros de salvar_reuniao.
export function validarReuniao(corpo) {
    const { tipo_reuniao, data, hora_inicio, hora_fim, tempo_total, partes } = corpo ?? {};

    if (!TIPOS_REUNIAO.includes(tipo_reuniao)) {
        throw new ErroApi(400, "tipo_reuniao deve ser mds ou fds");
    }
    if (typeof data !== "string" || !FORMATO_DATA.test(data)) {
        throw new ErroApi(400, "data deve estar no formato AAAA-MM-DD");
    }
    if (typeof hora_inicio !== "string" || !FORMATO_HORA.test(hora_inicio)) {
        throw new ErroApi(400, "hora_inicio deve estar no formato HH:MM");
    }
    if (typeof hora_fim !== "string" || !FORMATO_HORA.test(hora_fim)) {
        throw new ErroApi(400, "hora_fim deve estar no formato HH:MM");
    }

    const tempoTotalSegundos = tempoParaSegundos(tempo_total);
    if (tempoTotalSegundos === null) {
        throw new ErroApi(400, "tempo_total deve estar no formato HH:MM:SS");
    }

    return {
        p_tipo_reuniao: tipo_reuniao,
        p_data: data,
        p_hora_inicio: hora_inicio,
        p_hora_fim: hora_fim,
        p_tempo_total_segundos: tempoTotalSegundos,
        p_partes: validarPartes(partes)
    };
}

// Valida os filtros opcionais da listagem de reuniões.
export function validarFiltros({ data, tipo } = {}) {
    if (data !== undefined && !FORMATO_DATA.test(data)) {
        throw new ErroApi(400, "data deve estar no formato AAAA-MM-DD");
    }
    if (tipo !== undefined && !TIPOS_REUNIAO.includes(tipo)) {
        throw new ErroApi(400, "tipo deve ser mds ou fds");
    }

    return { data, tipo };
}
