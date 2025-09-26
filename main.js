// main.js
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');

let toastWindow = null;
let mainWindow = null;

function createToast(message) {
    // Close existing toast if any
    if (toastWindow) {
        toastWindow.close();
        toastWindow = null;
    }
    
    // Get cursor position
    const { x, y } = screen.getCursorScreenPoint();
    
    // Create toast window
    toastWindow = new BrowserWindow({
        width: 200,
        height: 60,
        x: x + 20, // Offset from cursor
        y: y - 30,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        skipTaskbar: true,
        resizable: false,
        focusable: false,
        show: false, // Don't show immediately
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    
    // Load HTML content for toast
    const toastHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: transparent;
                }
                .toast {
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    animation: fadeInOut 5s ease-in-out;
                }
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: scale(0.8); }
                    10% { opacity: 1; transform: scale(1); }
                    90% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.8); }
                }
            </style>
        </head>
        <body>
            <div class="toast">Shortcut ${message}</div>
        </body>
        </html>
    `;
    
    toastWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(toastHTML)}`);
    
    // Show window only after content is loaded to prevent focus stealing
    toastWindow.once('ready-to-show', () => {
        if (toastWindow) {
            toastWindow.showInactive(); // Show without stealing focus
        }
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (toastWindow) {
            toastWindow.close();
            toastWindow = null;
        }
    }, 5000);
}

// Error Handling
process.on('uncaughtException', (error) => {
    console.error("Unexpected error: ", error);
});
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false, // Don't show the main window
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    
    // Load the Angular app
    const isDev = !app.isPackaged || process.argv.includes('--dev');
    
    if (isDev) {
        // Development mode - use Angular dev server for hot reloading
        mainWindow.loadURL('http://localhost:4200');
        // Only show DevTools if needed for debugging UI
        // mainWindow.webContents.openDevTools();
        
        // Note: Electron reload disabled to avoid path issues
        // Angular dev server still provides hot reloading for the web content
    } else {
        // Production mode - use built files
        const indexPath = path.join(__dirname, 'dist/claudine/browser/index.html');
        mainWindow.loadFile(indexPath);
    }
}
// IPC handlers for shortcut management
ipcMain.handle('toggle-shortcut', (event, shortcut, enabled) => {
    if (enabled) {
        // Register the shortcut
        let shortcutNumber;
        switch(shortcut) {
            case 'Alt+F2':
                shortcutNumber = '2';
                break;
            case 'Alt+F3':
                shortcutNumber = '3';
                break;
            case 'Alt+F4':
                shortcutNumber = '4';
                break;
            default:
                return false;
        }
        
        const ret = globalShortcut.register(shortcut, () => {
            console.log(shortcutNumber);
            createToast(shortcutNumber);
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
    
    // Register Alt+F1 to toggle main window visibility
    globalShortcut.register('Alt+F1', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
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