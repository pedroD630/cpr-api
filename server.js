import express from 'express';

const server = express();

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.listen(8000, () => {console.log(`Running server on port 8000`);})