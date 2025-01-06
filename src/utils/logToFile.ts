import { app } from 'electron';
import fsSync from 'fs';
import path from 'path';

const logFile = path.join(app.getPath('userData'), 'app.log');
const logStream = fsSync.createWriteStream(logFile, { flags: 'a' });

export default function logToFile(message: string) {
  const datedMessage = `${new Date().toISOString()} - ${message}`;
  console.log(datedMessage);
  logStream.write(`${datedMessage}\n`);
}
