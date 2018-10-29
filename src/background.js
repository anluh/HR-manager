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

process.setMaxListeners(100);


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
  let dateFilter = '';

  if(arg.filterBy.Field === 'Name'){
    filter.key =  'Name';
    filter.value = arg.filterBy.Name;

  } else if (arg.filterBy.Field === 'Firm'){
    filter.key =  'Firm';
    filter.value = arg.filterBy.Firm;
  } else if (arg.filterBy.Field === 'Date') {
    if (arg.filterBy.Date.Start && !arg.filterBy.Date.End) {
      dateFilter = `Start >= ${arg.filterBy.Date.Start}`
    } else if (!arg.filterBy.Date.Start && arg.filterBy.Date.End) {
      dateFilter = `End <= ${arg.filterBy.Date.End}`
    } else if (arg.filterBy.Date.Start || arg.filterBy.Date.End) {
      dateFilter = `Start >= ${arg.filterBy.Date.Start} AND End <= ${arg.filterBy.Date.End}`
    }
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

  if(dateFilter){
    if(arg.filterBy.Active){
      db.serialize(function () {
        let totalItems = 0;
        db.each(`SELECT count(*) FROM Workers WHERE ${dateFilter} AND Active = ${parseInt(arg.filterBy.Active)}`, (err, rows) => {
          totalItems = rows['count(*)'];
        });
        db.each(`SELECT * FROM Workers WHERE ${dateFilter} AND Active = ${parseInt(arg.filterBy.Active)} LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
          let response = {};
          response.totalItems = totalItems;
          response.rows = rows;
          mainWindow.webContents.send("printWorkersFilter:res", response);
        })
      });
    } else {
      db.serialize(function () {
        let totalItems = 0;
        db.each(`SELECT count(*) FROM Workers WHERE ${dateFilter}`, (err, rows) => {
          totalItems = rows['count(*)'];
        });
        db.each(`SELECT * FROM Workers WHERE ${dateFilter} LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
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
    db.run(`INSERT into Workers (Name, Age, Sex, Firm, Firm_id, Start, End, Active) values('${arg.Name}', '${arg.Age}', '${arg.Sex}', '${arg.Firm.Name}', ${arg.Firm.Id}, '${arg.Start}', '${arg.End}', ${parseInt(arg.Active)})`, function(err){
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
    db.run(`INSERT into Firms (Name, Address, Active) values('${arg.Name}', '${arg.Address}', ${parseInt(arg.Active)})`, function(err){
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
    db.each(`SELECT count(*) FROM Workers WHERE Firm_id = '${arg.Id}'`, (err, rows) => {
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

ipcMain.on("edit-firm", function(event, arg) {
  let errors = [];
  let check = null;

  // Check if there are workers on the firm before change firm status to inactive
  db.each(`SELECT count(*) FROM Workers WHERE Firm_id = ${arg.Id}`, (err, rows) => {
    check = rows['count(*)'];

    if (check > 0 && parseInt(arg.Active) === 0) {
      errors.push('workers_err');

    } else {
      db.run(`UPDATE Firms SET Name='${arg.Name}', Address='${arg.Address}', Active=${parseInt(arg.Active)} WHERE Id=${parseInt(arg.Id)}`, (err) => {
        if (err) {
          errors.push(err);
        }
      });
      db.run(`UPDATE Workers SET Firm='${arg.Name}' WHERE Firm_id=${parseInt(arg.Id)}`, (err) => {
        if (err) {
          errors.push(err);
        }
      });
    }

    errors.length > 0 ? event.returnValue = false : event.returnValue = true;
  });

});

ipcMain.on("edit-worker", (event, arg) => {
  db.run(`UPDATE Workers SET Name='${arg.Name}', Age='${arg.Age}', Sex='${arg.Sex}', Firm='${arg.Firm.Name}', Firm_id=${arg.Firm.Id}, Start='${arg.Start}', End='${arg.End}', Active=${parseInt(arg.Active)} WHERE Id=${parseInt(arg.Id)}`, (err) => {
    if (err) {
      console.log(err)
      event.returnValue = false
    } else {
      event.returnValue = true
    }
  });
});
