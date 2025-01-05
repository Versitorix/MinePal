import { useRouter } from "./RouterContext";

type RouteProps = {
  path: string;
  component: React.FunctionComponent
}

export default function Route({ path, component: Component }: RouteProps) {
  const { location } = useRouter();

  if (location !== path) return null;

  return (
    <Component />
  );
}
