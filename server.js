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

app.get("/", async function (request, response) {
  // Hier halen we de titel van de eerste task op.
  const directusRespone = await fetch(
    "https://fdnd-agency.directus.app/items/dropandheal_task/1?fields=title"
  );
  /*
  het response uit directus ziet eruit als volgt:

  {
  "data": {
    "title": "Het verlies aanvaarden"
    }
  }

  dus op de onderstaande manier skippen we 'data' en halen we hier direct title uit.
  */
  const {
    data: { title },
  } = await directusRespone.json();

  // we zetten het allemaal naar lowercase en veranderen de spaces in -
  const taskRedirect = convertSlugTitle(title);

  response.render("index.liquid", { taskRedirect });
});

app.set("port", process.env.PORT || 8000);

app.listen(app.get("port"), function () {
  console.log(
    `Project draait via http://localhost:${app.get(
      "port"
    )}/\n\nSucces deze sprint. En maak mooie dingen! 🙂`
  );
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
app.get("/:taskName/:id/drops", async function (request, response) {
  const { taskName, id } = request.params;

  // converteer slug naar bruikbare titel
  const taskTitle = convertSlugTitle(taskName);

  // Haal de correcte taak op
  const taskData = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_eq]=${taskTitle}`
  );

  // Destructureren we het netjes
  const {
    data: [task],
  } = await taskData.json();

  // Haal de correcte lijst aan messages op via de task tabel
  // Het id zetten we hier op -1 omdat de array van 0 begint en niet 1
  const messagesAPI = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_messages?filter[exercise][_eq]=${
      task.exercise[id - 1]
    }&limit=-1&sort=-date_created`
  );

  const { data: messagesJSON } = await messagesAPI.json();
  const link = `/${taskName}/${id}/drops`;
  themeCache.theme = task.theme;
  response.render("drops.liquid", { messages: messagesJSON, themeCache, link, gebruiker });
});

app.post("/:taskSlug/:id/drops", async function (request, response) {
  const {community_drop: message, concept, anonymous, person} = request.body
  const messagesAPI = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_messages?filter[exercise][_eq]=2&limit=-1&sort=-date_created`
  );

  const { data: foundMessage } = await messagesAPI.json();

  const conceptData = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_messages?filter[exercise][_eq]=${foundMessage[0].exercise}&filter[from][_eq]=${gebruiker}&filter[concept][_eq]=true&sort=-date_created&limit=1`
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
        exercise: foundMessage[0].id,
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

// Taak ophalen gebaseerd op naam
app.get("/:taskSlug", async function (request, response) {
  // Zetten we in een makkelijk te gebruiken const
  const taskSlug = request.params.taskSlug;

  // Hover over de convertSlugTitle functie, daar staat alles netjes op beschreven
  const taskTitle = convertSlugTitle(taskSlug);

  // We willen specifiek ALLE data van die taak hebben
  const taskResponse = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_eq]=${taskTitle}&fields=*,exercise.title,exercise.messages,exercise.duration,exercise.image.width,exercise.image.height,exercise.image.id`
  );

  // Destructureren - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring
  const {
    data: [mainTask],
  } = await taskResponse.json(); // Je zet de data om in JSON

  // Hier voegen we onze slug toe aan het bestaande object
  mainTask.slug = taskSlug;

  // Met _neq halen we alle taken op die NIET de gegeven taak zijn
  const allTasksResponse = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_neq]=${taskTitle}`
  );
  const { data: allTasks } = await allTasksResponse.json();

  // We loopen door elke taak heen
  allTasks.forEach((task) => {
    // en we converten de titel naar een nette slug en voegen het veld & value toe aan elke taak
    task.slug = convertSlugTitle(task.title);
  });

  updateTheme(mainTask);

  // We returnern allTasks, en taskId om erachter te komen welke task we willen.
  response.render("task.liquid", { mainTask, allTasks, themeCache });
});

const gebruiker = process.env.GEBRUIKER || "Bert";

// Server cache voor het opslaan van de oefeningen die behoren tot de gekozen taak
let taskCache = null;

// Route voor oefeningen
app.get("/:taskSlug/:id", async function (request, response) {
  const exerciseIndex = request.params.id - 1;
  const taskSlug = request.params.taskSlug;
  const taskTitle = convertSlugTitle(taskSlug);

  // Als er nog geen cache is of als er een andere taak opgevraagd is, dan wil ik de oefeningen van de taak ophalen
  if (!taskCache || taskCache.title !== taskTitle) {
    const res = await fetch(
      `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_eq]=${taskTitle}&fields=title,theme,exercise.*,exercise.messages,exercise.image.width,exercise.image.height,exercise.image.id`
    );
    const { data } = await res.json();

    // Sla de nieuwe data op
    taskCache = data[0];
    // Voeg vervolgens de nieuwe titel toe in een nieuw veldje in de cache
    taskCache.title = taskTitle;
  }

  // Pak de exercise gebaseerd op het id, zo is het een logische url structuur: 1, 2, 3, 4 op elke taak
  const exercise = taskCache.exercise[exerciseIndex];

  // Functie om het correcte thema in te stellen & te onthouden
  updateTheme(taskCache);

  response.render("exercise.liquid", {
    exercise,
    taskSlug,
    themeCache,
  });
});

app.get("/:taskName/:id/drops/comment", async function (request, response) {
  const { taskName, id } = request.params;

  // converteer slug naar bruikbare titel
  const taskTitle = convertSlugTitle(taskName);

  // Haal de correcte taak op
  const taskData = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_task?filter[title][_eq]=${taskTitle}`
  );

  // Destructureren we het netjes
  const {
    data: [task],
  } = await taskData.json();

  // Haal de correcte lijst aan messages op via de task tabel
  // Het id zetten we hier op -1 omdat de array van 0 begint en niet 1
  const messagesAPI = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_messages?filter[exercise][_eq]=${
      task.exercise[id - 1]
    }&limit=-1&sort=-date_created`
  );

  const { data: messagesJSON } = await messagesAPI.json();
  const link = `/${taskName}/${id}/drops`;
  const open = true;
  themeCache.theme = task.theme;
  response.render("drops.liquid", {
    messages: messagesJSON,
    link,
    open,
    themeCache,
  });
});
