import Typography from "../atom/Typography";

type Props = {
  href: string;
  title: string;
};

function Link({ href, title }: Props) {
  return (
    <div className="flex justify-center pt-5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-platinum w-full text-center font-semibold uppercase lg:w-auto lg:min-w-100"
        aria-label={title}
        title={title}
      >
        <div className="shadow-effect button-shadow mt-2">
          <div className="backdrop-glass button-glass">
            <Typography component="span" className="block px-6 py-3">
              {title}
            </Typography>
          </div>
        </div>
      </a>
    </div>
  );
}

export default Link;
