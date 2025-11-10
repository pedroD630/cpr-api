import express from 'express';

const server = express();

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.listen(PORT, () => {console.log(`Running server on port ${PORT}`);})