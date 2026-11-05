import app from './app.js';

const porta = process.env.PORT ?? 8000;

app.listen(porta, () => {
    console.log(`Running server on port ${porta}`);
});
