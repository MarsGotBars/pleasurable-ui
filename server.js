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

// taken pagina ophalen 
app.get('/task/:id', async function (request, response) {       // Je haalt de id op die uit de filter (<a> van task.lquid) komt. 
  const taskId = request.params.id - 1;                               // Je maakt een variabele aan voor de opgevraagde id
  const taskResponse = await fetch(`https://fdnd-agency.directus.app/items/dropandheal_task`) // De variable kan je in de link terug laten komen + door de fields komen taken en opdrachten samen in een API.
  const {data: taskResponseJSON} = await taskResponse.json() // Je zet de data om in JSON

  // Iteratief halen we alle plaatjes op, we zetten -1 omdat de id in directus start op 1 en niet op 0
  const exerciseData = taskResponseJSON[taskId].exercise.map( async (exerciseCount) => {
    
    // exerciseCount is het id van de exercise die we ophalen
    const imgData = await fetch(`https://fdnd-agency.directus.app/items/dropandheal_exercise?filter[id][_eq]=${exerciseCount}&fields=*,image.width,image.height,image.id`)

    // destructureren - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring
    const {data: imgJSON} = await imgData.json();
    return imgJSON[0]
  });

  // we returnern allTasks, en taskId om erachter te komen welke task we willen.
  response.render('task.liquid', {allTasks: taskResponseJSON || [], taskId, exerciseData }) 
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