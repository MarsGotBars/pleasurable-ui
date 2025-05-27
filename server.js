// general
import express from "express";
import { Liquid } from "liquidjs";
import { convertSlugTitle } from "./utils/titleConvert.js";
import "dotenv/config";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const engine = new Liquid();
app.engine("liquid", engine.express());

app.set("views", "./views");

app.set("port", process.env.PORT || 8000);

app.listen(app.get("port"), function () {
  console.log(`Project draait via http://localhost:${app.get("port")}/`);
});

app.get("/favicon.ico", (req, res) => {
  // You can either serve a favicon file if you have one:
  // res.sendFile('path/to/favicon.ico');
  // Or simply return an empty response with 204 No Content status
  res.status(204).end();
});

// Home route (most specific)
app.get("/", async function (request, response) {
  // we zetten het allemaal naar lowercase en veranderen de spaces in -, in het geval dat themeCache.title niet bestaat, gebruiken we de title die we eerder hebben opgehaald

  response.render("index.liquid");
});

// Taak ophalen gebaseerd op naam
app.get("/:taskSlug", async function (request, response) {
  // Zetten we in een makkelijk te gebruiken const
  const taskSlug = request.params.taskSlug;

  // Hover over de convertSlugTitle functie, daar staat alles netjes op beschreven
  const taskTitle = convertSlugTitle(taskSlug);

  // Hier zetten we de mainTask en allTasks alvast neer
  let mainTask;
  let allTasks;

  // Als de cache niet bestaat of de titel niet hetzelfde is als de taskTitle, dan halen we de data op van de task
  const taskResponse = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_eq]=${taskTitle}&fields=*,exercise.title,exercise.messages,exercise.duration,exercise.id,exercise.image.width,exercise.image.height,exercise.image.id`
  );

  // Destructureren - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring
  const {
    data: [fetchedTask],
  } = await taskResponse.json(); // Je zet de data om in JSON

  if (!fetchedTask) {
    return response.status(404).send(`Task not found for: ${taskSlug}`);
  }

  // Set main task and update cache
  mainTask = fetchedTask;
  themeCache = fetchedTask;

  // Update theme now that we have new data
  updateTheme(mainTask);

  // Met _neq halen we alle taken op die NIET de gegeven taak zijn - moved outside the if/else
  const allTasksResponse = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_neq]=${taskTitle}`
  );
  allTasks = (await allTasksResponse.json()).data;

  // Hier voegen we onze slug toe aan het bestaande object
  mainTask.slug = taskSlug;

  // We loopen door elke taak heen
  allTasks.forEach((task) => {
    // en we converten de titel naar een nette slug en voegen het veld & value toe aan elke taak
    task.slug = convertSlugTitle(task.title);
  });

  // We returnern allTasks, en taskId om erachter te komen welke task we willen.
  response.render("task.liquid", { mainTask, allTasks, themeCache });
});

// Server cache voor het opslaan van de oefeningen die behoren tot de gekozen taak
let taskCache = null;

// Route voor oefeningen
app.get("/:taskSlug/:id", async function (request, response) {
  const exerciseId = request.params.id;
  const exerciseIndex = exerciseId - 1;
  const taskSlug = request.params.taskSlug;
  const taskTitle = convertSlugTitle(taskSlug);
  
  // Always fetch fresh data for this route
  const res = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_eq]=${taskTitle}&fields=title,theme,exercise.*,exercise.messages,exercise.image.width,exercise.image.height,exercise.image.id`
  );
  const {
    data: [currentTask],
  } = await res.json();


  const exercise = currentTask.exercise[exerciseIndex];
  
  if (!exercise) {
    return response.status(404).send(`Exercise not found at position: ${exerciseId}`);
  }

  if (themeCache != currentTask.theme) {
    // Functie om het correcte thema in te stellen & te onthouden
    updateTheme(currentTask);
  }

  response.render("exercise.liquid", {
    exercise,
    exerciseId,
    taskSlug,
    exerciseId,
    themeCache,
  });
});

let themeCache = {};

function updateTheme(task) {
  // Als de titel niet hetzelfde is dan updaten we deze waardes
  if (themeCache.title != task.title) {
    // Hier slaan we het momentele thema op
    themeCache.theme = task.theme;
    themeCache.title = task.title;
  }
}

// drops pagina
app.get("/:taskSlug/:id/drops", async function (request, response) {
  const { taskSlug, id } = request.params;
  console.log(taskSlug, id);
  // converteer slug naar bruikbare titel
  const taskTitle = convertSlugTitle(taskSlug);

  // Haal de correcte taak op met exercise details
  const taskData = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_eq]=${taskTitle}&fields=title,theme,exercise.*`
  );

  // Destructureren we het netjes
  const {
    data: [task],
  } = await taskData.json();
  
  // Find exercise by position in array
  const dropsExerciseIndex = id - 1; // Convert URL id (1,2,3,4) to array index (0,1,2,3)
  const exercise = task.exercise[dropsExerciseIndex];
  
  if (!exercise) {
    return response.status(404).send(`Exercise not found at position: ${id}`);
  }
  
  console.log('Found exercise:', exercise.id);
  
  // Haal de correcte lijst aan messages op via de task tabel
  const messagesAPI = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_messages?filter[exercise][_eq]=${exercise.id}&filter[concept][_eq]=false&limit=-1&sort=-date_created`
  );

  const { data: messagesJSON } = await messagesAPI.json();

  const link = `/${taskSlug}/${id}/drops`;

  // Update theme and set custom title for drops page
  themeCache.theme = task.theme;

  // Bouw een mooie titel op voor de drops pagina
  const exerciseTitle = exercise.title || `Oefening ${id}`; // Fallback

  themeCache.title = `Drops voor ${exerciseTitle}`;
  
  response.render("drops.liquid", {
    messages: messagesJSON,
    themeCache,
    link,
    gebruiker,
    exerciseId: exercise.id,
    urlId: id, // Pass the URL id for the form action
    taskSlug,
  });
});

// drops pagina
app.get("/:taskSlug/:id/drops/comment", async function (request, response) {
  const { taskSlug, id } = request.params;
  const open = true;

  // converteer slug naar bruikbare titel
  const taskTitle = convertSlugTitle(taskSlug);

  // Haal de correcte taak op met exercise details
  const taskData = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_eq]=${taskTitle}&fields=title,theme,exercise.*`
  );

  // Destructureren we het netjes
  const {
    data: [task],
  } = await taskData.json();
  
  // Find exercise by position in array
  const commentExerciseIndex = id - 1; // Convert URL id (1,2,3,4) to array index (0,1,2,3)
  const exercise = task.exercise[commentExerciseIndex];
  
  if (!exercise) {
    return response.status(404).send(`Exercise not found at position: ${id}`);
  }
  
  // Haal de correcte lijst aan messages op via de task tabel
  const messagesAPI = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_messages?filter[exercise][_eq]=${exercise.id}&filter[concept][_eq]=false&limit=-1&sort=-date_created`
  );

  const { data: messagesJSON } = await messagesAPI.json();

  const link = `/${taskSlug}/${id}/drops`;

  // Update theme and set custom title for drops page
  themeCache.theme = task.theme;

  // Bouw een mooie titel op voor de drops pagina
  const exerciseTitle = exercise.title || `Oefening ${id}`; // Fallback

  themeCache.title = `Drops voor ${exerciseTitle}`;

  response.render("drops.liquid", {
    messages: messagesJSON,
    themeCache,
    link,
    gebruiker,
    exerciseId: exercise.id,
    urlId: id, // Pass the URL id for the form action
    taskSlug,
    open,
  });
});

app.post("/:taskSlug/:id/drops", async function (request, response) {
  const { taskSlug, id } = request.params;

  const { community_drop: message, concept, anonymous, person, exercise } = request.body;
  const messagesAPI = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_messages?filter[exercise][_eq]=2&limit=-1&sort=-date_created`
  );

  const { data: foundMessage } = await messagesAPI.json();

  const conceptData = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_messages?filter[exercise][_eq]=${exercise}&filter[from][_eq]=${gebruiker}&filter[concept][_eq]=true&sort=-date_created&limit=1`
  );

  const { data: messageConcept } = await conceptData.json();

  if (messageConcept) {
    // Doe iets leuks hier!
    // Skip ik voor nu omdat we hogere prio items hebben staan
    // return
  }
  
  // Onze post
  const data = await fetch(
    "https://fdnd-agency.directus.app/items/dropandheal_messages",
    {
      method: "POST",
      body: JSON.stringify({
        exercise: exercise,
        text: message,
        // Als concept true is, gebruik de persoon die is ingelogd, als concept false is, kiest de gebruiker zelf
        // concept is een string value, dus we moeten deze checken met !== "true"
        from: anonymous && concept !== "true" ? "anoniem" : person,
        concept: concept,
      }),
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
    }
  );

  // Controleer of de data response OK is (status 200-299)
  if (!data.ok) {
    // Hier kan ik zien welke error voorkwam op de foutieve data
    throw new Error(data.status);
  }

  // Als de gebruiker een bericht stuurt, wil ik deze in-faden
  // Hier gebruik ik locals voor, en maak ik een custom variabele aan die ik later kan clearen
  response.locals.newComment = "";

  // Door naar drops als alles goed is verlopen
  return response.redirect(303, `/${taskSlug}/${id}/drops`);
});

const gebruiker = process.env.GEBRUIKER || "Bert";