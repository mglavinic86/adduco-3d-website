/** Approved captions and framing anchors; DESIGN.md remains the visual contract. */
export const scenes = [
  {
    id: "vizija",
    name: "Vizija",
    label: "ADDUCO · GRAĐEVINARSTVO",
    title: ["Od vizije", "do stvarnosti."],
    copy: ["Visokogradnja i niskogradnja.", "Betonski radovi i prometnice."],
    action: "Upoznajte Adduco",
    href: "#o-nama",
    still: "transition-1/ORIENTATION-start.webp",
  },
  {
    id: "povjerenje",
    name: "Betonski radovi",
    label: "Betonski radovi",
    title: ["Snaga je", "u detalju."],
    copy: ["Betoniranje i izvedba betonskih konstrukcijskih elemenata."],
    action: "Istražite usluge",
    href: "#usluge",
    still: "transition-1/ORIENTATION-end.webp",
  },
  {
    id: "preciznost",
    name: "Visokogradnja",
    label: "Visokogradnja",
    title: ["Gradimo", "u visinu."],
    copy: ["Izvedba objekata i njihovih nosivih konstrukcija."],
    action: "Istražite usluge",
    href: "#usluge",
    still: "transition-2/ORIENTATION-end.webp",
  },
  {
    id: "projekt",
    name: "Vaš projekt",
    label: "Vaš sljedeći projekt",
    title: ["Vaš projekt", "počinje razgovorom."],
    copy: ["Visokogradnja, niskogradnja i betonski radovi."],
    action: "Razgovarajmo",
    href: "#kontakt",
    still: "transition-3/ORIENTATION-end.webp",
  },
] as const;

export const sceneStill = (scene: number, portrait: boolean) =>
  `/assets/${scenes[scene].still.replace("ORIENTATION", portrait ? "portrait" : "landscape")}`;

export const sceneMedia = [1, 2, 3].flatMap((segment) =>
  (["forward", "reverse"] as const).map((direction) => ({
    key: `${segment}-${direction}`,
    segment,
    direction,
  })),
);
