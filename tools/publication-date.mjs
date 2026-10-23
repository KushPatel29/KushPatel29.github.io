// Publication dates use the author's current publishing clock consistently
// in local checks and UTC-hosted CI.
export function publicationDate(value = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(value));
}
