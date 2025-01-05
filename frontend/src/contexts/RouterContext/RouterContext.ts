import { createContext, useContext } from "react";

type RouterContextType = {
  location: string;
  to: (newLocation: string) => void;
  back: () => void;
}

const DEFAULT_ROUTER_CONTEXT: RouterContextType = {
  location: "/",
  to: () => { },
  back: () => { },
};

export const RouterContext = createContext(DEFAULT_ROUTER_CONTEXT);

export function useRouter() {
  return useContext(RouterContext);
}
