// main.js
const { app, BrowserWindow } = require('electron');
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
// App Lifecycle
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});