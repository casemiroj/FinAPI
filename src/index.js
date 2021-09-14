const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const costumers = [];

// Middleware
function verifyIfExistAccount(request, response, next) {
  const { cpf } = request.headers;
  
  const costumer = costumers.find(costumer => costumer.cpf === cpf);
  
  if(!costumer) response.status(400).json({error: "Costumer not found"});

  request.costumer = costumer;

  return next();
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const costumerExists = costumers.some(
    costumer => costumer.cpf === cpf
  );

  if(costumerExists) response.status(400).json({error: "Costumer already exists!"});

  costumers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  return response.status(201).send();
});

app.get('/statement', verifyIfExistAccount,(request, response) => {
  const { costumer } = request;
  return response.json(costumer.statement);
});

app.listen(3333);