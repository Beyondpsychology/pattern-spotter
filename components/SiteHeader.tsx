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
          src="https://beyondpsychology.eu/wp-content/uploads/2026/08/New-black-white-logo-BP-1-scaled.png"
          alt="Beyond Psychology"
          className="h-8 w-auto md:h-10"
        />
      </a>
    </header>
  );
}
