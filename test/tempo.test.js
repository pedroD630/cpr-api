import assert from "node:assert/strict";
import { test } from "node:test";
import { tempoParaSegundos } from "../utils/tempo.js";

test("converte os formatos gerados pelo app", () => {
    assert.equal(tempoParaSegundos("00:00"), 0);
    assert.equal(tempoParaSegundos("10:05"), 605);
    assert.equal(tempoParaSegundos("00:10:05"), 605);
    assert.equal(tempoParaSegundos("01:45:30"), 6330);
});

test("aceita ajustes manuais comuns", () => {
    assert.equal(tempoParaSegundos(" 10:05 "), 605);
    assert.equal(tempoParaSegundos("5:30"), 330);
    assert.equal(tempoParaSegundos("75:00"), 4500);
});

test("rejeita tempos inválidos", () => {
    for (const tempo of ["", "abc", "10", "10:5", "10:60", "01:60:00", "-1:00", "1:2:3:4", null, undefined, 600]) {
        assert.equal(tempoParaSegundos(tempo), null, `aceitou ${tempo}`);
    }
});
