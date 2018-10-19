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

ipcMain.on("printWorkers", (event, arg) => {
  let pageOffset = arg.currentPage * arg.perPage - arg.perPage;

  db.serialize(function(){
    let totalItems = 0;
    db.each(`SELECT count(*) FROM Workers`, (err, rows) => {
      totalItems = rows['count(*)'];
    });
    db.each(`SELECT * FROM Workers LIMIT ${arg.perPage} OFFSET ${pageOffset}`, (err, rows) => {
      let response = {};
      response.totalItems = totalItems;
      response.rows = rows;
      mainWindow.webContents.send("printWorkers:res", response);
    })
  });

});

ipcMain.on("printWorkersFilter", (event, arg) => {
  let pageOffset = arg.pagination.currentPage * arg.pagination.perPage - arg.pagination.perPage;
  let filter = {};

  if(arg.filterBy.Name){
    filter.key =  'Name';
    filter.value = arg.filterBy.Name;

  } else if (arg.filterBy.Firm){
    filter.key =  'Firm';
    filter.value = arg.filterBy.Firm;
  }

  if(filter.key) {

    // Check if Filter by Active exist
    if(arg.filterBy.Active){
      db.serialize(function () {
        let totalItems = 0;
        db.each(`SELECT count(*) FROM Workers WHERE ${filter.key} = '${filter.value}' AND Active = ${parseInt(arg.filterBy.Active)}`, (err, rows) => {
          totalItems = rows['count(*)'];
        });
        db.each(`SELECT * FROM Workers WHERE ${filter.key} = '${filter.value}' AND Active = ${parseInt(arg.filterBy.Active)} LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
          let response = {};
          response.totalItems = totalItems;
          response.rows = rows;
          mainWindow.webContents.send("printWorkersFilter:res", response);
        })
      });
    } else {

      db.serialize(function () {
        let totalItems = 0;
        db.each(`SELECT count(*) FROM Workers WHERE ${filter.key} = '${filter.value}'`, (err, rows) => {
          totalItems = rows['count(*)'];
        });
        db.each(`SELECT * FROM Workers WHERE ${filter.key} = '${filter.value}' LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
          let response = {};
          response.totalItems = totalItems;
          response.rows = rows;
          mainWindow.webContents.send("printWorkersFilter:res", response);
        })
      });
    }
  }

});

// Just Active Filter
ipcMain.on("workerFilterActive", (event, arg) => {
  let pageOffset = arg.pagination.currentPage * arg.pagination.perPage - arg.pagination.perPage;

  db.serialize(function () {
    let totalItems = 0;
    db.each(`SELECT count(*) FROM Workers WHERE Active = ${parseInt(arg.filterBy.Active)}`, (err, rows) => {
      totalItems = rows['count(*)'];
    });
    db.each(`SELECT * FROM Workers WHERE Active = ${parseInt(arg.filterBy.Active)} LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
      let response = {};
      response.totalItems = totalItems;
      response.rows = rows;
      mainWindow.webContents.send("workerFilterActive:res", response);
    })
  });
});


ipcMain.on("printFirms", function() {
  db.serialize(function(){
    db.each("SELECT * FROM Firms", (err, rows) => {
      mainWindow.webContents.send("printFirms:res", rows);
    })
  });
});

// Add new worker
ipcMain.on("add-worker", function (event, arg){
  db.serialize(function () {
    db.run(`INSERT into Workers (Name, Age, Sex, Firm, Start, End, Active) values('${arg.name}', '${arg.age}', '${arg.sex}', '${arg.firm}', '${arg.startFormated}', '${arg.endFormated}', ${parseInt(arg.Active)})`, function(err){
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

// Add new firm
ipcMain.on("add-firm", function (event, arg){
  db.serialize(function () {
    db.run(`INSERT into Firms (Name, Address, Active) values('${arg.name}', '${arg.address}', ${parseInt(arg.active)})`, function(err){
      if(err){
        console.log(err);
        event.returnValue = err
      } else {
        event.returnValue = true;
      }
    })
  });
})

// Delete firm
ipcMain.on("delete-firm", function (event, arg) {
  db.serialize(function () {
    // Before delete firm, check if there are workers on this firm
    let check = null;
    db.each(`SELECT count(*) FROM Workers WHERE Firm = '${arg.Name}'`, (err, rows) => {
      check = rows['count(*)'];

      if(check === 0) {
        db.run(`DELETE from Firms WHERE Id=${arg.Id}`, function (err) {
          if (err) {
            console.log(err);
            event.returnValue = err;
          } else {
            event.returnValue = true;
          }
        })
      } else {
        event.returnValue = 'err_workers'
      }
    });
  });
});
