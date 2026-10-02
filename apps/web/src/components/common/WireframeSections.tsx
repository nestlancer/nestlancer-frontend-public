type Section = {
  title: string;
  items: string[];
};

interface WireframeSectionsProps {
  sections: Section[];
}

export function WireframeSections({ sections }: WireframeSectionsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {sections.map((section) => (
        <section key={section.title} className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold">{section.title}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {section.items.map((item) => (
              <li key={item} className="rounded-md bg-muted/60 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
