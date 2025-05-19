/**
 * Converteert slugs naar titels en andersom
 * 
 * Deze functie detecteert of je een slug stuurt of een titel d.m.v. een one-line if statement
 * 
 * @param {string} string - opgestuurde titel / slug
 * @returns {string} - geconverteerde slug / titel
 * 
 * @voorbeld-slug
 * convertSlugTitle("het-verlies-aanvaarden") // Returns "Het verlies aanvaarden"
 * 
 * @voorbeld-titel
 * convertSlugTitle("Het verlies aanvaarden") // Returns "het-verlies-aanvaarden"
 */
export const convertSlugTitle = (string) => {
  return string.includes('-')
    ? string.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())  // slug => title
    : string.toLowerCase().replace(/\s+/g, '-');                     // title => slug
};