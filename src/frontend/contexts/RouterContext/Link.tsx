import { useRouter } from "./RouterContext";

export default function Link({ children, href, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { to } = useRouter();

  return (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault();
        if (href) {
          to(href);
        }

        onClick?.(event);
      }}
      href={href}
    >
      {children}
    </a>
  )
} 
