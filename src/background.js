'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
if (isDevelopment) {
  // Don't load any native (external) modules until the following line is run:
  require('module').globalPaths.push(process.env.NODE_MODULES_PATH)
}



// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })
function createMainWindow () {
  const window = new BrowserWindow()

  if (isDevelopment) {
    // Load the url of the dev server if in development mode
    window.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) window.webContents.openDevTools()
  } else {
    createProtocol('app')
    //   Load the index.html when not in development
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
      })
    )
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }
  mainWindow = createMainWindow()
})

// ================= API functionality =================

let sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./database.sqlite')

ipcMain.on("mainWindowLoaded", function () {

  db.serialize(function(){
    db.each("SELECT * FROM Workers", (err, rows) => {
      mainWindow.webContents.send("resultSent", rows);
    })
  });
  // db.close();

});

ipcMain.on("printFirms", function() {
  db.serialize(function(){
    db.each("SELECT * FROM Firms", (err, rows) => {
      mainWindow.webContents.send("printFirmsResult", rows);
    })
  });
});

// Add new worker
ipcMain.on("add-worker", function (event, arg){
  db.serialize(function () {
    db.run(`INSERT into Workers (Name, Age, Sex, Firm, Start, End) values('${arg.name}', ${parseInt(arg.age)}, '${arg.sex}', '${arg.firm}', '${arg.startFormated}', '${arg.endFormated}')`, function(err){
      if(err){
        // event.returnValue = err
        console.log(err)
      } else {
        event.returnValue = true;
      }
    })
  });
})

// Delete worker
ipcMain.on("delete-worker", function (event, arg) {
  db.serialize(function () {
    db.run(`DELETE from Workers WHERE Id=${arg}`, function(err){
      if(err){
        console.log(err);
        event.returnValue = err;
      } else {
        event.returnValue = true;
      }
    })
  });
})
