const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const costumers = [];

function verifyIfExistAccount(request, response, next) {
  const { cpf } = request.headers;
  
  const costumer = costumers.find(costumer => costumer.cpf === cpf);
  
  if(!costumer) response.status(400).json({error: "Costumer not found"});

  request.costumer = costumer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit'){
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
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

app.post('/deposit', verifyIfExistAccount, (request, response) => {
  const { description, amount } = request.body;
  const { costumer } = request;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: 'credit'
  };

  costumer.statement.push(statementOperation);

  response.status(201).send();
});

app.post('/withdraw', verifyIfExistAccount, (request, response) => {
  const { amount } = request.body;
  const { costumer } = request;

  const balance = getBalance(costumer.statement);

  if(balance < amount) {
    return response.status(400).json({error: 'Insufficient funds!'})
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: 'debit'
  };

  costumer.statement.push(statementOperation);

  return response.status(201).send();

});

app.get('/statement', verifyIfExistAccount,(request, response) => {
  const { costumer } = request;
  return response.json(costumer.statement);
});

app.get('/statement/date', verifyIfExistAccount,(request, response) => {
  const { costumer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = costumer.statement.filter(
    (statement) =>
      statement.createdAt.toDateString() === 
      new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.get('/account',verifyIfExistAccount, (request, response) => {
  const { costumer } = request;

  return response.json(costumer)
});

app.put('/account', verifyIfExistAccount, (request, response) => {
  const { name } = request.body;
  const { costumer } = request;

  costumer.name = name;

  response.status(201).send();
});

app.listen(3333);