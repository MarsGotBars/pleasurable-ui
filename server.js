// general 
import express from 'express'
import { Liquid } from 'liquidjs';

const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))

const engine = new Liquid()
app.engine('liquid', engine.express())

app.set('views', './views')


app.get('/', async function (request, response) {
  response.render('index.liquid')
})

app.set('port', process.env.PORT || 8000)

app.listen(app.get('port'), function () {
  console.log(`Project draait via http://localhost:${app.get('port')}/\n\nSucces deze sprint. En maak mooie dingen! 🙂`)
})

// drops pagina
app.get('/drops', async function (request, response) {

  const messagesAPI = await fetch ('https://fdnd-agency.directus.app/items/dropandheal_messages?limit=-1&sort=-date_created')
  
  const messagesJSON = await messagesAPI.json()

  response.render('drops.liquid', { messages: messagesJSON.data })
})

// taken pagina ophalen 
app.get('/task/:id', async function (request, response) {       // Je haalt de id op die uit de filter (<a> van task.lquid) komt. 
  const task = request.params.id;                               // Je maakt een variabele aan voor de opgevraagde id
  const taskResponse = await fetch(`https://fdnd-agency.directus.app/items/dropandheal_task/?fields=*.*.*&filter={"id":"${task}"}&limit=1`) // De variable kan je in de link terug laten komen + door de fields komen taken en opdrachten samen in een API.
  const taskResponseJSON = await taskResponse.json()            // Je zet de data om in JSON

  response.render('task.liquid', {task: taskResponseJSON.data?.[0] || [] }) 
})


// opdrachten ophalen voor op taken pagina
app.get('/exercise/:id', async function (request, response) {
  const exercise = request.params.id;
  const exerciseResponse = await fetch(`https://fdnd-agency.directus.app/items/dropandheal_exercise/?fields=*.*&filter={"id":"${exercise}"}&limit=1`)
  const exerciseResponseJSON = await exerciseResponse.json()
  console.log(exerciseResponseJSON)

  const messagesResponse = await fetch(`https://fdnd-agency.directus.app/items/dropandheal_messages?filter={"_and":[{"exercise":{"_eq":"${request.params.id}"}},{"from":{"_contains":"Jules_"}}]}`)
  const messagesResponseJSON = await messagesResponse.json()

  response.render('exercise.liquid', {exercise: exerciseResponseJSON.data?.[0] || [], messagesLength: messagesResponseJSON.data.length })
})