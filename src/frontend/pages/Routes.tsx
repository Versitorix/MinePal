import Route from "../contexts/RouterContext/Route";
import Home from "./Home";
import Settings from "./Settings";

export default function Routes() {
  return (
    <>
      <Route path="/" component={Home} />
      <Route path="/settings" component={Settings} />
    </>
  )
}
