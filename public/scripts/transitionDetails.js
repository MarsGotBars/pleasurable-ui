// Als ViewTransition mogelijk is
if (document.startViewTransition) {
  // Selecteer het details element in de header
  const headerDetails = document.querySelector("nav details");

  // Onthou de state van het details element (open/dicht)
  let openDetail = false;

  // Op click
  headerDetails.addEventListener("click", (e) => {
    // Start transitie
    document.startViewTransition(() => {
      // invert openDetail om details open/dicht te zetten
      openDetail = !openDetail;
      headerDetails.open = openDetail;
    });
    
    if(!e.target.href){
      // Prevent default aan het einde in het geval dat er iets fout gaat
      e.preventDefault();
    }
  });
}
