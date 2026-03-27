import Typography from "../atom/Typography";

type Props = {
  href: string;
  title: string;
};

function Link({ href, title }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-platinum w-full text-center font-semibold uppercase lg:w-auto"
      aria-label={title}
      title={title}
    >
      <div className="shadow-effect button-shadow">
        <div className="backdrop-glass button-glass">
          <Typography component="span" className="block px-6 py-3">
            {title}
          </Typography>
        </div>
      </div>
    </a>
  );
}

export default Link;
