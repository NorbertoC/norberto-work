import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function ButtonLink({ children, className = "", variant = "secondary", ...props }: ButtonLinkProps) {
  const variantClassName = variant === "primary" ? "button--primary" : "";

  return (
    <a className={`button ${variantClassName} ${className}`.trim()} {...props}>
      {children}
    </a>
  );
}
