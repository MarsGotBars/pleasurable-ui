const dialog = document.querySelector("dialog");

export default function openDialog () {               // dit is om hem in andere scripts te kunnen gebruiken. 
  dialog.showModal();
}
if ("set" == dialog.dataset.open ) {
  openDialog()
}