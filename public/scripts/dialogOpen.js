export default function openDialog () {               // dit is om hem in andere scripts te kunnen gebruiken. 
  const dialog = document.querySelector("dialog");
  dialog.showModal();
}

openDialog()