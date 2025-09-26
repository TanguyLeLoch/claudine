// main.js
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// Error Handling
process.on('uncaughtException', (error) => {
    console.error("Unexpected error: ", error);
});
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    
    // Load the Angular app
    const isDev = !app.isPackaged || process.argv.includes('--dev');
    
    if (isDev) {
        // Development mode - use Angular dev server for hot reloading
        win.loadURL('http://localhost:4200');
        win.webContents.openDevTools();
        
        // Note: Electron reload disabled to avoid path issues
        // Angular dev server still provides hot reloading for the web content
    } else {
        // Production mode - use built files
        const indexPath = path.join(__dirname, 'dist/claudine/browser/index.html');
        win.loadFile(indexPath);
    }
}
// IPC handlers for shortcut management
ipcMain.handle('toggle-shortcut', (event, shortcut, enabled) => {
    if (enabled) {
        // Register the shortcut
        let shortcutNumber;
        switch(shortcut) {
            case 'Alt+F1':
                shortcutNumber = '1';
                break;
            case 'Alt+F2':
                shortcutNumber = '2';
                break;
            case 'Alt+F3':
                shortcutNumber = '3';
                break;
            default:
                return false;
        }
        
        const ret = globalShortcut.register(shortcut, () => {
            console.log(shortcutNumber);
        });
        
        if (!ret) {
            console.log(`Registration failed for ${shortcut}`);
            return false;
        }
        
        console.log(`${shortcut} shortcut registered`);
        return true;
    } else {
        // Unregister the shortcut
        globalShortcut.unregister(shortcut);
        console.log(`${shortcut} shortcut unregistered`);
        return true;
    }
});

// App Lifecycle
app.whenReady().then(() => {
    createWindow();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Unregister all shortcuts when app is about to quit
        globalShortcut.unregisterAll();
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});