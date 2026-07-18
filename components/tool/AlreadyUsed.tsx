export default function AlreadyUsed() {
  return (
    <div className="text-center">
      <p className="eyebrow text-base mb-3">Already spotted</p>
      <h1 className="text-3xl mb-6">You've already used your free reading with this email.</h1>
      <div className="divider" />
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <a
          href="https://beyondpsychology.eu"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary sm:w-auto px-8"
        >
          See the shop
        </a>
        <a
          href="https://beyondpsychology.eu/overcome-people-pleasing/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary sm:w-auto px-8 bg-terracotta"
        >
          See the toolkit
        </a>
      </div>
    </div>
  );
}
