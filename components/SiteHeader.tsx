export default function SiteHeader() {
  return (
    <header className="w-full px-6 py-4 md:px-10 md:py-6">
      <a
        href="https://beyondpsychology.eu"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://beyondpsychology.eu/wp-content/uploads/2025/06/LOGO-BP-WEBSITE.png"
          alt="Beyond Psychology"
          className="h-8 w-auto md:h-10"
        />
      </a>
    </header>
  );
}
