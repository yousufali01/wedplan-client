import Link from "next/link";

type PagePlaceholderProps = {
  title: string;
  description: string;
  cta?: {
    href: string;
    label: string;
  };
};

/**
 * Temporary stand-in page used while scaffolding the app's routes.
 * Each feature task replaces the placeholder page file with real UI.
 */
export function PagePlaceholder({ title, description, cta }: PagePlaceholderProps) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center sm:py-32">
      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
        Coming soon
      </span>
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="max-w-md text-balance text-muted-foreground">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {cta.label}
        </Link>
      )}
    </section>
  );
}
