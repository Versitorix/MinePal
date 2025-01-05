import { Radio } from "react-feather";
import './Announcement.css';
import { getAnnouncements } from '../utils/api';
import useWebRequest from '../hooks/useWebRequest';

function Announcement() {
  const { data: announcement } = useWebRequest("/announcements", getAnnouncements)

  if (!announcement) return null;

  return (
    <div className="announcement-bar">
      <Radio className="announcement-icon" size={20} />
      <span className="announcement-text">{announcement}</span>
    </div>
  );
}

export default Announcement; 
