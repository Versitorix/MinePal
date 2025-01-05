import Actions from "../components/Actions/Actions";
import Announcement from "../components/Announcement";
import ErrorDisplay from "../components/ErrorDisplay";
import GuidesLink from "../components/GuidesLink";
import Profiles from "../components/Profiles";
import settingNotes from "../utils/settingsNotes";
import Settings from "../components/Settings";

export default function Home() {
  return (
    <div className="container">
      <h1>MinePal Control Panel</h1>
      <Announcement />
      <Settings />
      <label htmlFor="profiles">
        Your pals:
        {settingNotes.pal_message && <span className="setting-note"> ({settingNotes.pal_message})</span>}
      </label>
      <Profiles />
      <Actions />
      <ErrorDisplay />
      <GuidesLink />
    </div>
  );
}
