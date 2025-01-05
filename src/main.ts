import fs from 'fs';
import { promisify } from 'util';
import { app, BrowserWindow, systemPreferences } from 'electron';
import path from 'path';
import { startServer } from './server';
import { createStream } from 'rotating-file-stream';
import { autoUpdater } from 'electron-updater';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

autoUpdater.setFeedURL({
    provider: 's3',
    bucket: 'minepal-installers',
    region: 'us-east-1',
});

const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

const DEBUG = !!process.env.DEBUG;

const logDirectory = app.getPath('userData');
const logStream = createStream('app.log', {
    size: '500K', // Rotate every 500KB
    path: logDirectory
});

function logToFile(message: string) {
    logStream.write(`${new Date().toISOString()} - ${message}\n`);
}

async function checkAndCopyProfile() {
    const profilesDir = path.join(logDirectory, 'profiles');
    const ethanJsonPath = path.join(app.getAppPath(), 'ethan.json');
    const targetPath = path.join(profilesDir, 'ethan.json');

    try {
        await access(profilesDir);
    } catch (err) {
        await mkdir(profilesDir);
        logToFile('Created profiles directory');
        // Only add ethan if there's no profile dir.
        try {
            await copyFile(ethanJsonPath, targetPath);
            logToFile('Copied ethan.json to profiles directory');
        } catch (err) {
            logToFile('Failed to copy ethan.json: ' + err);
        }
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 655,
        height: 1000,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });


    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    if (DEBUG) {
        mainWindow.webContents.openDevTools(); // Open Electron DevTools
    }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length) {
            if (windows[0].isMinimized()) windows[0].restore();
            windows[0].focus();
        }
    });

    app.on('ready', async () => {
        createWindow(); // Create the window first
        logToFile(`Platform: ${process.platform}`);
        if (process.platform === 'darwin') { // Check if the platform is macOS
            try {
                const micAccess = await systemPreferences.askForMediaAccess('microphone');
                if (micAccess) {
                    logToFile("Microphone access granted");
                }
            } catch (error) {
                logToFile("Failed to request microphone access: " + error);
            }
        }
        try {
            startServer();
        } catch (error) {
            logToFile("Failed to start server: " + error);
        }
        await checkAndCopyProfile(); // Check and copy profile
        autoUpdater.checkForUpdatesAndNotify();
    });

    autoUpdater.on('error', (err) => {
        logToFile('Error in auto-updater. ' + err);
    })
    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        logToFile(log_message);
    })
    autoUpdater.on('update-available', () => {
        logToFile('Update available.');
    });

    autoUpdater.on('update-not-available', () => {
        logToFile('No update available.');
    });

    autoUpdater.on('update-downloaded', () => {
        logToFile('Update downloaded; will install now');
        autoUpdater.quitAndInstall();
    });
}

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
