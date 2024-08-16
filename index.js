const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();

app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Custom token to log request body
morgan.token("body", (req) => JSON.stringify(req.body));

// Custom format to include method, URL, status, response time, and request body
const customMorganFormat =
  ":method :url :status :res[content-length] - :response-time ms :body";

// Use morgan middleware with custom format
app.use(morgan(customMorganFormat));

let persons = [
  {
    id: 1,
    name: "Arto Hellas",
    number: "123",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    number: "123",
  },
  {
    id: 3,
    name: "Dan Abramov",
    number: "12-43-234345",
  },
];

app.get("/info", (request, response) => {
  const personCount = persons.length;
  const requestTime = new Date();
  response.send(`<p>Phonebook has info for ${personCount} people</p>
    <p>Request made at: ${requestTime}</p>`);
});

const generateId = () => {
  return Math.floor(Math.random() * 1000000);
};

app.post("/api/persons", (request, response) => {
  const body = request.body;
  const newPersonName = body.name;
  const duplicatePerson = persons.find(
    (person) => person.name === newPersonName
  );

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: "content missing",
    });
  }

  if (duplicatePerson) {
    return response.status(409).json({
      error: "name must be unique",
    });
  }

  const person = {
    id: generateId(),
    name: body.name,
    number: body.number,
  };

  persons = persons.concat(person);

  response.json(person);
});

app.get("/api/persons", (request, response) => {
  response.json(persons);
});

app.delete("/api/persons/:id", (request, response) => {
  const id = Number(request.params.id);
  persons = persons.filter((person) => person.id !== id);

  response.status(204).end();
});

app.get("/api/persons/:id", (request, response) => {
  const id = Number(request.params.id);
  const person = persons.find((person) => person.id === id);

  if (person) {
    response.json(person);
  } else {
    response.status(404).end();
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
