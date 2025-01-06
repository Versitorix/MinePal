import { app } from "electron";
import fs from 'fs/promises';
import path from "path";
import { ServerSideBotProfile } from "../types/botProfile";

const profilesDir = path.join(app.getPath('userData'), 'profiles');

export async function getProfiles() {
  return Promise.all((await fs.readdir(profilesDir))
    .filter((file) => file.endsWith('.json'))
    .map(async (file): Promise<ServerSideBotProfile> => {
      const profilePath = path.join(profilesDir, file);
      const profileData = JSON.parse(await fs.readFile(profilePath, 'utf8'));

      return {
        name: profileData.name,
        personality: profileData.personality,
        conversing: profileData.conversing,
        coding: profileData.coding,
        saving_memory: profileData.saving_memory
      };
    }));
}

export async function updateProfiles(profiles: ServerSideBotProfile[]) {
  const filesToDelete = (await fs.readdir(profilesDir)).filter((file) => (
    profiles.some((profile) => !file.startsWith(profile.name))
  ));
  await Promise.all(filesToDelete.map((file) => fs.rm(path.join(profilesDir, file))));

  await Promise.all(profiles.map(profile => fs.writeFile(
    path.join(profilesDir, `${profile.name}.json`),
    JSON.stringify(profile, null, 4)
  )));
}
