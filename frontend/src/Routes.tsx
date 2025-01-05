import Route from "./contexts/RouterContext/Route";
import Home from "./pages/Home";
import Settings from "./pages/Settings";

export default function Routes() {
  return (
    <>
      <Route path="/" component={Home} />
      <Route path="/settings" component={Settings} />
    </>
  )
}
