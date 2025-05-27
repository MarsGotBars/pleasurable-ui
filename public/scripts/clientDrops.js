import openDialog from "./dialogOpen.js"; // voorkomt dubbele code je laadt anders JS in

const heading = document.querySelector("h2");
const dialog = document.querySelector("dialog");
const form = document.querySelector("form");
const openButton = document.querySelector(".post-btn");
const dialogClose = document.querySelector(".closing-button");


// Functie om de state van het formulier te wijzigen
function setFormState(state) {
  form.setAttribute('data-state', state);
}

if (dialog) {
  openButton.addEventListener("click", (e) => {
    // opent de dialog
    openDialog();
    e.preventDefault();
  });

  dialogClose.addEventListener("click", (e) => {
    // sluit de dialog
    dialog.close();
    e.preventDefault();
  });
}

if ("fetch" in window && "DOMParser" in window) {
  document.addEventListener("submit", async (e) => {
    // als er gesubmit is dan ...
    setFormState("loading"); // geeft default styling van form aan, als die loading is

    const submitForm = e.target; // weet welk formulier gesubmit wordt (voor als je meerdere hebt handig)
    const formData = new FormData(submitForm); // zet de gegevens uit het formulier om in data
    const formDataObject = new URLSearchParams(formData); // Je maakt een object van al je velden

    e.preventDefault(); // wij nemen overhand, geen refresh meer
    try {
      const response = await fetch(form.action, {
        // action staat in de form zelf
        method: form.method, // POST
        body: formDataObject, // alle info uit form
      });

      if (!response.ok) {
        throw new Error("Response not ok!"); // als er een error is met de response dan gooit die je naar de catch toe
      }

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
