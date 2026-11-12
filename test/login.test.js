import assert from "node:assert/strict";
import { test } from "node:test";
import { DOMINIO_USUARIOS, loginParaEmail } from "../utils/login.js";

test("nome de usuário vira e-mail no domínio do app", () => {
    assert.equal(loginParaEmail("admin"), `admin@${DOMINIO_USUARIOS}`);
    assert.equal(loginParaEmail("  Central.Norte "), `central.norte@${DOMINIO_USUARIOS}`);
});

test("e-mail é aceito como está, em minúsculas", () => {
    assert.equal(loginParaEmail("Pessoa@Exemplo.com.br"), "pessoa@exemplo.com.br");
});

test("rejeita logins inválidos", () => {
    for (const login of ["", "a", "com espaço", "-admin", "x".repeat(31), "sem@dominio", "@x.com", undefined]) {
        assert.throws(() => loginParaEmail(login), (erro) => erro.status === 400, `aceitou ${login}`);
    }
});
