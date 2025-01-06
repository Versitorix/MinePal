import { useState } from 'react';
import { getProfiles, saveProfiles, sendMessage } from '../utils/api';
import { BotProfile } from '../../types/botProfile';
import './Profiles.css';
import { useAgent } from '../contexts/AgentContext/AgentContext';
import { useErrorReport } from '../contexts/ErrorReportContext/ErrorReportContext';
import useWebRequest from '../hooks/useWebRequest';

function Profiles() {
  const { data: profiles = [], refetch } = useWebRequest("profiles", getProfiles);
  const { selectedProfiles, toggleProfile } = useAgent();
  const { declareError } = useErrorReport();

  const [editingProfileIndex, setEditingProfileIndex] = useState<number | null>(null);
  const [editingProfile, setEditingProfile] = useState<BotProfile>();
  const [customMessage, setCustomMessage] = useState("");
  const [error, setError] = useState<string>();

  const openModal = (profile = { name: '', personality: '' }, index: number | null = null) => {
    setEditingProfileIndex(index);
    setEditingProfile({ ...profile });
  };

  const closeModal = () => {
    setEditingProfile(undefined);
    setEditingProfileIndex(null);
    setError(undefined); // Clear error on modal close
  };

  const saveChanges = async () => {
    const sanitized = {
      name: editingProfile?.name.trim(),
      personality: editingProfile?.personality.trim(),
    }

    if (sanitized.name === '' || sanitized.personality === '') {
      setError('Name and personality must not be empty');
      return;
    }

    if (profiles.some((p, idx) => p.name === sanitized.name && idx !== editingProfileIndex)) {
      setError('A profile with this name already exists');
      return;
    }

    const updatedProfiles = [...profiles];
    if (editingProfileIndex !== null) {
      updatedProfiles[editingProfileIndex] = sanitized as BotProfile;
    } else {
      updatedProfiles.push(sanitized as BotProfile);
    }

    console.log(updatedProfiles);
    try {
      await saveProfiles(updatedProfiles);
      await refetch();
      closeModal();
    } catch (error) {
      declareError("Profiles", error);
      setError("Failed to save profiles. Please try again.");
    }
  };

  const deleteProfile = async () => {
    if (editingProfileIndex === null) return;

    const updatedProfiles = profiles.filter((_, idx) => idx !== editingProfileIndex);
    console.log(updatedProfiles);

    try {
      await saveProfiles(updatedProfiles);
      closeModal();
    } catch (error) {
      declareError("Profiles", error);
      setError("Failed to delete profile. Please try again.");
    }
  };

  const handleCheckboxClick = (_: React.ChangeEvent<HTMLInputElement>, profile: BotProfile) => {
    toggleProfile(profile);
  };

  return (
    <div className="profiles">
      {profiles.map((profile, index) => (
        <div key={index} className="profile-box" onClick={() => openModal(profile, index)}>
          <input
            type="checkbox"
            checked={selectedProfiles.some(selectedProfile => selectedProfile.name === profile.name)}
            onChange={(e) => handleCheckboxClick(e, profile)}
            onClick={(e) => e.stopPropagation()}
          />
          <span>{profile.name}</span>
        </div>
      ))}
      <div className="profile-box empty" onClick={() => openModal()}>
        <span>+</span>
      </div>

      {editingProfile && (
        <div className="modal">
          <div className="modal-content">
            <input
              type="text"
              value={editingProfile.name}
              onChange={({ target: { value } }) => setEditingProfile((currentEditingProfile) => ({
                ...currentEditingProfile!,
                name: value,
              }))}
              placeholder="Name"
            />
            <textarea
              value={editingProfile.personality}
              onChange={({ target: { value } }) => setEditingProfile((currentEditingProfile) => ({
                ...currentEditingProfile!,
                personality: value,
              }))}
              placeholder="Personality"
            />
            <div className="send-group">
              <input
                type="text"
                value={customMessage}
                onChange={({ target: { value } }) => setCustomMessage(value)}
                onSubmit={() => {
                  sendMessage(editingProfile.name, customMessage);
                }}
                placeholder="Send messages in the game's chat as the bot"
              />              <button className="send-button" onClick={() => sendMessage(editingProfile.name, customMessage)}>Send</button>
            </div>
            <div className="button-group">
              <button className="save-button" onClick={saveChanges}>Save</button>
              <button className="cancel-button" onClick={closeModal}>Cancel</button>
              {editingProfileIndex !== null && (
                <button className="delete-button" onClick={deleteProfile}>Delete Pal</button>
              )}
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profiles;
