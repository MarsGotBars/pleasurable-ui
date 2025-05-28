# Pleasurable User Interface

Ontwerp en maak met een team voor een opdrachtgever een interface waar gebruikers blij van worden.

De instructie vind je in: [INSTRUCTIONS.md](https://github.com/fdnd-task/pleasurable-ui/blob/main/docs/INSTRUCTIONS.md)



## Inhoudsopgave

  * [Beschrijving](#beschrijving)
  * [Gebruik](#gebruik)
  * [Kenmerken](#kenmerken)
  * [Ontwerpkeuzes](#ontwerpkeuzes)
  * [Performance & accessibillity](#performance&accessibillity)
  * [Installatie](#installatie)
  * [Bronnen](#bronnen)
  * [Licentie](#licentie)

## Beschrijving
Afgelopen 3 weken hebben wij gewerkt aan een dynamische website. Naast de functional, usable & reliable laag lag deze sprint ook veel op de pleasurable laag van de website. Dit houdt in dat je animaties aan de site toevoegd om de ervaring 'leuker' te maken. 

[Bekijk hier de site zelf!](https://pleasurable-ui-jl3a.onrender.com/)

Wij hebben zo deze 3 animaties toegevoegd:


### Card hover

https://github.com/user-attachments/assets/e4eb6258-fa97-4201-8c35-4dae83de0256


### Form states & new comments

https://github.com/user-attachments/assets/bb00cc3b-f4bb-415c-9b66-474e8dad9fd9

### View transition

https://github.com/user-attachments/assets/778ec226-676a-4354-8d27-3e3d11c3dfb5

## Gebruik
Drop & heal is een site dat je helpt bij het rouwproces. Je kunt er verschillende taken volgen en hierbij bijbehorende opdrachten maken. Bij deze opdrachten kun je een drop (ervaring) achterlaten en deze van anderen lezen.


## Kenmerken
### :hover animatie 
Voor deze animatie is gebruik gemaakt van de `:hover` selector in CSS. Ook moest hiervoor een `:before` toegevoegd worden in de CSS. Zie hier de uitgebreide bijbehorende code.
<details><summary><i>css hover animatie</i></summary>
 
```css
.post-btn {
    background-color: var(--button-color);
    border-radius: var(--border-radius);
    padding: var(--xs) var(--sm);
    position: fixed;
    bottom: 10vh;
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    overflow: hidden;

    span {
        position: relative;
        z-index: 20;
    }
}

.post-btn:hover::before {
    width: 100%;
}

.post-btn::before {
    content: "";
    background-color: var(--button-hover);
    width: 0;
    height: 100%;
    transition: width .3s;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
}
```
 
</details>


### new drop animatie
Voor de nieuwe drop animatie is er gebruik gemaakt van een keyframe animatie in CSS. De class wordt dan meegegeven aan de geplaatste comment via JS.
<details><summary><i>CSS keyframes</i></summary>
 
```css
.new-drop-animation {
    animation: new-drop-added 1s forwards;
    overflow: hidden;
    background-color: var(--button-color);
}


@keyframes new-drop-added {
    0% {
        height: 0;
    }
    30% {
        height: auto;
    }
    40% {
        background-color: var(--button-color);
    }
    100% {
        background-color: var(--background-color-lighter);
    }
}
```
</details>
<details><summary><i>JS class meegeven aan geplaatste drop</i></summary>
 
```js
      const responseText = await response.text();
      const parser = new DOMParser();
      const responseDOM = parser.parseFromString(responseText, "text/html");
      const newCard = responseDOM.querySelector("article"); // pakt uit de response niet de hele HTML maar alleen de drop
      const dropsSection = document.querySelector(".drops-section");
      const newForm = responseDOM.querySelector("form");


      setTimeout(() => {
        // loading + succes state
        setFormState("success");


        setTimeout(() => {
          setFormState("default");
          form.innerHTML = newForm.innerHTML;
          if (dialog) {
            dialog.close();
          }
          setTimeout(() => {
            if (newCard) {
            // als er een nieuwe kaart is dan ...
              newCard.classList.add('new-drop-animation');
              heading.insertAdjacentElement("afterend", newCard);     // sluit weer na de post de dialog            
            } 
          }, 200);
        }, 1000);
      }, 300);
    } catch (error) {
      setTimeout(() => {
        setFormState("error");
        setTimeout(() => {
          setFormState("default");
          if (dialog) {
            dialog.close();
          }
        }, 1500);
      }, 300);
    }
  });
}
```
 
</details>

<details><summary>View transition snippet</summary>

Hierbij gebruik je navigation:auto; voor de view transition opt-in (per pagina) 

```css
@view-transition{
    navigation:auto;
}

```

En heb ik in de liquid alle items gebaseerd op `forloop.index` een identifier meegegeven:

bijvoorbeelde de h3
```liquid
<h3 style="--title: title-{{forloop.index}};">{{ exercise.title }}</h3>
```

en vervolgens geef ik ze een view-transition-name in css gebaseerd op deze css variabele

```css
::view-transition-group(*) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.61, 0.61, 0.61, 0.93);
}

.container-card {
  view-transition-name: var(--card);
}

article h3 {
  view-transition-name: var(--title);
}

picture {
  view-transition-name: var(--image);
}
```

Hierbij zorgt ::view-transition-group(*) dat ik alle view-transition items selecteer een bepaalde animaties(-timings en durations) kan geven.

De items moeten op de vervolg pagina ook weer dezelfde benamingen hebben voor de correcte flow.

</details>

### animatie opdrachten kaartjes op taken pagina
Voor deze animatie is gebruik gemaakt van view transitions. Voeg hier nog even je code toe marcin en vul aan ... mis ik nog iets?


## Ontwerpkeuzes
Voor de ontwerpkeuzes van de animaties hebben wij deze eerst uitgewerkt in FIGMA. Dit om een duidelijker beeld te schetsen van wat je ongeveer wilt maken en dit ook om het beter uit te kunnen leggen aan een ander. Bekijk ze met onderstaande links.

[animatie :hover en nieuwe drop.](https://www.figma.com/proto/cUbcDPwp7NVM3F5HsmEOV3/animations?page-id=0%3A1&node-id=20-88&viewport=-127%2C573%2C0.9&t=ByE53exzyEN49yCN-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=20%3A88&show-proto-sidebar=1)


De `:hover` heeft goeie feedforward, want geeft aan dat je wat kunt doen met de knop (klikken). Dit doordat de buttom met een slide-in donkerder wordt van kleur. De animatie van de nieuwe drop geeft goede feedback. Dit omdat de drop bovenaan erbij wordt geplaatst in de kleur van het thema. Dit accentueert de nieuwe drop duidelijk en maakt dus duidelijk dat je comment erbij gekomen is. 


[animatie opdrachten kaartjes op taken pagina.](https://www.figma.com/proto/fA4tDC72hSePfg9ifoiYBS/FDND-2025-editable?node-id=1428-20458&t=EgHZ5AhSa8jjkUwy-0&scaling=min-zoom&content-scaling=fixed&page-id=1191%3A16291&starting-point-node-id=1428%3A20458&show-proto-sidebar=1)


De animatie van de opdrachten kaartjes geeft een leuker effect of van de taken naar de opdrachten pagina te gaan. Dit omdat de zelfde elementen op beide pagina's voorkomen alleen zich anders positioneren wat voor een 'pleausurable' animatie zorgt.


## Performance & accessibillity
Voor zowel performance en accesibillity zijn verschillende tests uitgevoerd. Deze zijn uitgebreid terug te lezen via [deze link](https://github.com/MarsGotBars/pleasurable-ui/issues/75).


## Installatie
In dit project wordt gebruik gemaakt van NodeJS. Om aan dit project te werken moet NodeJS geïnstalleerd zijn. Eenmaal geïnstalleerd kan het project geopend worden in de code editor.

Voer in de terminal `npm install` uit om alle afhankelijkheden te installeren.

Voer vervolgens `npm start` uit om de server te starten.

Ga in je browser naar http://localhost:8000 om het project te bekijken.


## Bronnen

## Licentie

This project is licensed under the terms of the [MIT license](./LICENSE).
