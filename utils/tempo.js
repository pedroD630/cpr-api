// Converte os tempos do app ("MM:SS" ou "HH:MM:SS") em segundos.
// Retorna null quando o texto não é um tempo válido.
export function tempoParaSegundos(tempo) {
    if (typeof tempo !== "string") return null;

    const partes = /^(?:(\d{1,3}):)?(\d{1,3}):(\d{2})$/.exec(tempo.trim());
    if (!partes) return null;

    const horas = Number(partes[1] ?? 0);
    const minutos = Number(partes[2]);
    const segundos = Number(partes[3]);

    if (segundos > 59) return null;
    if (partes[1] !== undefined && minutos > 59) return null;

    return horas * 3600 + minutos * 60 + segundos;
}
