const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate } = require('uuid');
const { request, response } = require('express');

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username == username);

  if(!user) {
    return response.status(404).json({ error: 'User dont found'});
  }

  request.user = user;

  return next();
}

function checksCreateTodosUserAvailability(request, response, next) {
  const { user } = request;

  if((user.pro === false && user.todos.length < 10) || user.pro === true) {
    return next();
  }

  return response.status(403).json({ error: ' Free plan limit reached. please upgrade to pro'});

}

function checksTodoExists(request, response, next) {
  const { username } = request.headers;
  const { id } = request.params;

  const user = users.find(user => user.username == username);

  if(!user){
    return response.status(404).json({ error: "User dont found" });
  }

  if(!validate(id)) {
    return response.status(400).json({ error: "todo ID is incorrect."});
  }

  const todo = user.todos.find(todo => todo.id === id);
  if(!todo) {
    return response.status(404).json({ error: "todo not found." });
  }

  request.todo = todo;
  request.user = user;
  

  return next();
}

function findUserById(request, response, next) {
  const { id } = request.params;

  const user = users.find(user => user.id === id);

  if(!user) {
    return response.status(404).json({ error: 'User dont found'});
  }

  request.user = user;

  return next();
}

app.post('/users', (request, response) => {
  const {name, username} = request.body

  const userExists = users.find(user => user.username === username)

  if (userExists) {
    return response.status(400).json({ error: 'Username already exists'})
  }

  const user = {
    id: uuidv4(),
    name,
    pro: false,
    username,
    todos: []
  }

  users.push(user);

  return response.status(201).json(user)
});

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);

});

app.patch('/user/:id/pro',  findUserById, (request, response) => {
  const { user } = request;

  if(user.pro) {
    return response.status(400).json({ error: 'pro plan is already ativated'})
  }

});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  
  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;

  const todo = user.todos.find(todo => todo.id == id);
  if(!todo) {
    return response.status(404).json({ error: 'Todo not found'})
  }

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);


});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todo = user.todos.find(todo => todo.id == id);

  if(!todo) {
    return response.status(404).json({ error: 'Todo not found'})
  }

  todo.done = true;

  return response.json(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todoIndex = user.todos.findIndex(todo => todo.id == id);

  if(todoIndex == -1) {
    return response.status(404).json({ error: 'Todo not found'});
  }

  user.todos.splice(todoIndex, 1);

  return response.status(204).json();

});


module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};