require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const path = require('path')
const Person = require('./models/person')

app.use(cors())

// Middleware to parse JSON bodies
app.use(express.json())

// Custom token to log request body
morgan.token('body', (req) => JSON.stringify(req.body))

// Custom format to include method, URL, status, response time, and request body
const customMorganFormat =
  ':method :url :status :res[content-length] - :response-time ms :body'

// Use morgan middleware with custom format
app.use(morgan(customMorganFormat))

// Middleware for serving static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')))

// Routes
app.get('/info', (request, response, next) => {
  Person.countDocuments({})
    .then(count => {
      const requestTime = new Date()
      response.send(`<p>Phonebook has info for ${count} people</p>
        <p>Request made at: ${requestTime}</p>`)
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({ error: 'Name and number are required' })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save()
    .then(savedPerson => {
      console.log('Person saved:', savedPerson)
      response.status(201).json(savedPerson) // 201 Created status code
    })
    .catch(error => next(error))
})

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then(persons => {
      console.log('Successfully fetched persons')
      response.json(persons)
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { number } = request.body

  // Create an object with the fields to update
  const updatedPerson = { number }

  // Find the person by ID and update their number
  Person.findByIdAndUpdate(
    request.params.id,
    updatedPerson,
    { new: true, runValidators: true, context: 'query' } // options: return the updated document and apply schema validations
  )
    .then(updatedPerson => {
      if (updatedPerson) {
        response.json(updatedPerson)
      } else {
        response.status(404).json({ error: 'Person not found' })
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      if (result) {
        response.status(204).end()
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

// Fallback route for single-page applications (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// Error handling middleware
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})