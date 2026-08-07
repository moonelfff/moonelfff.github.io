import type { JSX } from "react";
import Typography from "../atom/Typography";

type Props = {
  href: string;
  title: string;
  icon?: ({
    color,
    width,
    height,
  }: {
    color: string;
    width: number;
    height: number;
  }) => JSX.Element;
};

function Link({ href, title, icon }: Props) {
  return (
    <div className="flex justify-center pt-5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-platinum w-full text-center font-semibold uppercase lg:w-auto"
        aria-label={title}
        title={title}
      >
        <div className="shadow-effect button-shadow mt-2">
          <div className="backdrop-glass button-glass flex w-full justify-center lg:w-auto lg:min-w-100">
            <div className="flex gap-2 px-6">
              <Typography
                component="span"
                className="block py-3 text-sm lg:text-base"
              >
                {title}
              </Typography>
              {icon && (
                <span className="flex items-center justify-center">
                  {icon({
                    color: "var(--color-platinum)",
                    width: 32,
                    height: 32,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

export default Link;
