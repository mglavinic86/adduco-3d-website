import records from "../content/projects.json";
import { Arrow } from "./ui";

type Project = {
  title: string;
  location: string;
  /** Confirmed project year, not the publication date of a source. */
  year: number | null;
  role: string;
  client: string | null;
  images: { src: string; alt: string; caption: string }[];
  caption: string;
  category: string;
  sourceUrl: string;
  sourceLabel: string;
  sourceDescription: string;
  scope: string | null;
};
const projects: Project[] = records;

export default function ProjectRecords() {
  return projects.map((project, index) => (
    <article className="project-record" key={project.sourceUrl}>
      <div className="project-index">
        {String(index + 1).padStart(2, "0")}
        <span>{project.location.toLocaleUpperCase("hr")}</span>
      </div>
      <div>
        <span className="eyebrow">{project.category}</span>
        <h3>{project.title}</h3>
        <p>{project.caption}</p>
        <a
          className="text-link small"
          href={project.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          {project.sourceLabel}
          <Arrow diagonal />
        </a>
        {project.images.length ? (
          <div className="project-photos">
            {project.images.map((image) => (
              <figure key={image.src}>
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="photo-pending">Fotografije u pripremi.</p>
        )}
      </div>
      <dl>
        <dt>Uloga</dt>
        <dd>{project.role}</dd>
        {project.client && (
          <>
            <dt>Naručitelj</dt>
            <dd>{project.client}</dd>
          </>
        )}
        {project.scope && (
          <>
            <dt>Zahvat</dt>
            <dd>{project.scope}</dd>
          </>
        )}
        {project.year && (
          <>
            <dt>Godina</dt>
            <dd>{project.year}</dd>
          </>
        )}
        <dt>Izvor</dt>
        <dd>{project.sourceDescription}</dd>
      </dl>
    </article>
  ));
}
