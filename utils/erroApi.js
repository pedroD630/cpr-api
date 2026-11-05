// Erro com mensagem segura para devolver ao cliente.
export class ErroApi extends Error {
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}
