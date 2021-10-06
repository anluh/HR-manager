'use strict'

import {app, protocol, BrowserWindow, ipcMain} from 'electron'
import * as path from 'path'
import {format as formatUrl} from 'url'
import {
  createProtocol,
} from 'vue-cli-plugin-electron-builder/lib'
import installExtension from 'electron-devtools-installer'

const isDevelopment = process.env.NODE_ENV !== 'production'
if (isDevelopment) {
  // Don't load any native (external) modules until the following line is run:
  require('module').globalPaths.push(process.env.NODE_MODULES_PATH)
}
import electron from "electron";

let sqlite3 = require('sqlite3').verbose();


// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

// Standard scheme must be registered before the app is ready
//protocol.registerStandardSchemes(['vector'], {secure: true});
protocol.registerSchemesAsPrivileged([{
  scheme: 'vector', privileges: {standard: true, secure: true, supportFetchAPI: true},
}]);

function createMainWindow() {
  const window = new BrowserWindow({
    icon: __dirname + 'assets/logo.png',
    title: 'HR Manager',
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // Remove menu bar
  // window.setMenu(null)

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

app.allowRendererProcessReuse = false

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
    await installExtension({
      id: 'ljjemllljcmogpfapbkkighbhhppjdbg',
      electron: '>=1.2.1'
    })
  }
  mainWindow = createMainWindow()
})

// ================= Database functionality =================

process.setMaxListeners(100);

const pathDatabase = path.join(path.dirname((electron.app || electron.remote.app).getPath('exe')), 'database.sqlite')

let db = new sqlite3.Database(pathDatabase)

ipcMain.on("ChangeCurrentDB", () => {
  db = new sqlite3.Database(pathDatabase)

  console.log('Database switched to new one')
  mainWindow.webContents.send("ChangeCurrentDB:res");
});

// ================= API functionality =================

ipcMain.on("printWorkers", (event, arg) => {
  let pageOffset = arg.currentPage * arg.perPage - arg.perPage;

  db.serialize(function () {
    let totalItems = 0;
    db.each(`SELECT count(*)
             FROM Workers`, (err, rows) => {
      totalItems = rows['count(*)'];
    });
    db.each(`SELECT *
             FROM Workers
             ORDER BY Name ASC LIMIT ${arg.perPage}
             OFFSET ${pageOffset}`, (err, rows) => {
      let response = {};
      response.totalItems = totalItems;
      response.rows = rows;
      mainWindow.webContents.send("printWorkers:res", response);
    })
  });

});

ipcMain.on("autocompleteWorkers", (event, arg) => {
  const result = []
  db.serialize(function () {
    db.each(`SELECT Id, Name
             FROM Workers
             WHERE (${parseFloat(arg.MonthStart)} > Start OR ${parseFloat(arg.MonthEnd)} > Start)
               AND (${parseFloat(arg.MonthStart)} < End)
             ORDER BY Name`, (err, rows) => {
      result.push(rows)
    }, () => {
      mainWindow.webContents.send("autocompleteWorkers:res", result);
    })
  });
});

ipcMain.on("printWorkersFilter", (event, arg) => {
  const pageOffset = arg.pagination.currentPage * arg.pagination.perPage - arg.pagination.perPage;
  let totalItems = 0

  let query = arg.name ? `Name LIKE '${arg.name}%'` : `Name IS NOT NULL`
  if (arg.firmId) query += ` AND Firm_id='${arg.firmId}'`
  if (arg.date) query += ` AND Start>${parseInt(arg.date)}`
  if (arg.active) query += ` AND Active='${arg.active}'`

  db.serialize(() => {
    db.get(`SELECT count(*)
            FROM Workers
            WHERE ${query}`, (err, rows) => {
      totalItems = rows['count(*)'];

      db.all(`SELECT *
              FROM Workers
              WHERE ${query}
              ORDER BY Name ASC LIMIT ${arg.pagination.perPage}
              OFFSET ${pageOffset}`, (err, rows) => {
        if (err) console.log(err)
        let response = {};
        response.totalItems = totalItems;
        response.rows = rows;
        mainWindow.webContents.send("printWorkersFilter:res", response);
      })
    });
  })
});

ipcMain.on("printFirms", function () {
  db.serialize(function () {
    db.all("SELECT * FROM Firms WHERE Active=1 ORDER BY Name ASC", (err, rows) => {
      mainWindow.webContents.send("printFirms:res", rows);
    })
  });
});

// Add new worker
ipcMain.on("add-worker", function (event, arg) {
  if (!arg.End) {
    arg.End = null
  }

  db.serialize(function () {
    db.get(`SELECT Name
            FROM Workers
            WHERE Name = '${arg.Name}'`, (err, row) => {
      if (row) event.returnValue = false;
      else {
        db.run(`INSERT into Workers (Name, Age, Sex, Firm, Firm_id, Start, End, Active)
                values ('${arg.Name}', '${arg.Age}', '${arg.Sex}', '${arg.Firm.Name}', ${arg.Firm.Id}, '${arg.Start}', '${arg.End}', ${parseFloat(arg.Active)})`, function (err) {
          if (err) console.log(err)
          event.returnValue = true;
        })
      }
    });
  });
})

ipcMain.on("edit-worker", (event, arg) => {
  if (!arg.End) {
    arg.End = null
  }
  db.run(`UPDATE Workers
          SET Name='${arg.Name}',
              Age='${arg.Age}',
              Sex='${arg.Sex}',
              Firm='${arg.Firm.Name}',
              Firm_id=${arg.Firm.Id},
              Start='${arg.Start}',
              End='${arg.End}',
              Active=${parseFloat(arg.Active)}
          WHERE Id = ${parseFloat(arg.Id)}`, (err) => {
    if (err) {
      console.log(err)
      event.returnValue = false
    } else {
      event.returnValue = true
    }
  });
});


// Delete worker
ipcMain.on("delete-worker", function (event, arg) {
  db.serialize(function () {
    let errors = [];

    db.run(`DELETE
            from Workers
            WHERE Id = ${arg}`, function (err) {
      if (err) {
        console.log(err);
        errors.push(err);
      }
    });
    db.run(`DELETE
            from Deposits
            WHERE Worker_id = ${arg}`, function (err) {
      if (err) {
        console.log(err);
        errors.push(err);
      }
    });
    db.run(`DELETE
            from History
            WHERE Worker_id = ${arg}`, function (err) {
      if (err) {
        console.log(err);
        errors.push(err);
      }
    });
    db.run(`DELETE
            from Reports
            WHERE Worker_id = ${arg}`, function (err) {
      if (err) {
        console.log(err);
        errors.push(err);
      }
    });

    errors.length > 0 ? event.returnValue = false : event.returnValue = true;

  });
})

// Add new firm
ipcMain.on("add-firm", function (event, arg) {
  db.serialize(function () {
    db.run(`INSERT into Firms (Name, Address, Active)
            values ('${arg.Name}', '${arg.Address}', ${parseFloat(arg.Active)})`, function (err) {
      if (err) {
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
    db.each(`SELECT count(*)
             FROM Workers
             WHERE Firm_id = '${arg.Id}'`, (err, rows) => {
      check = rows['count(*)'];

      if (check === 0) {
        db.run(`DELETE
                from Firms
                WHERE Id = ${arg.Id}`, function (err) {
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

ipcMain.on("edit-firm", function (event, arg) {
  let errors = [];
  let check = null;

  // Check if there are workers on the firm before change firm status to inactive
  db.each(`SELECT count(*)
           FROM Workers
           WHERE Firm_id = ${arg.Id}`, (err, rows) => {
    check = rows['count(*)'];

    if (check > 0 && parseFloat(arg.Active) === 0) {
      errors.push('workers_err');

    } else {
      db.run(`UPDATE Firms
              SET Name='${arg.Name}',
                  Address='${arg.Address}',
                  Active=${parseFloat(arg.Active)}
              WHERE Id = ${parseFloat(arg.Id)}`, (err) => {
        if (err) {
          errors.push(err);
        }
      });
      db.run(`UPDATE Workers
              SET Firm='${arg.Name}'
              WHERE Firm_id = ${parseFloat(arg.Id)}`, (err) => {
        if (err) {
          errors.push(err);
        }
      });
    }

    errors.length > 0 ? event.returnValue = false : event.returnValue = true;
  });

});

// ============= Hours API ==============
ipcMain.on("add-salary", function (event, arg) {
  arg.Hours = arg.Hours.replace(',', '.')
  db.serialize(function () {
    // If hours added to worker in current month -> show err
    db.each(`SELECT count(*)
             FROM History
             WHERE Worker_id = ${arg.Worker.Id} AND Firm = '${arg.Firm.Name}' AND Month BETWEEN ${parseFloat(arg.MonthStart)} AND ${parseFloat(arg.MonthEnd)}`, (err, rows) => {
      if (rows['count(*)'] > 0) {
        event.returnValue = 'err_exist'
      } else {
        db.run(`INSERT into History (Worker_id, Worker_name, Month, Hours, Firm)
                values (${arg.Worker.Id}, '${arg.Worker.Name}', ${parseFloat(arg.MonthStart)}, '${arg.Hours}', '${arg.Firm.Name}')`, function (err) {
          if (err) {
            console.log(err);
            event.returnValue = false;
          } else {
            event.returnValue = true;
          }
        });
      }
    });


  });
});

ipcMain.on("fetchHoursHistory", function (event, arg) {
  let query = '';
  if (arg.month) query += `AND Month BETWEEN ${parseFloat(arg.month.MonthStart)} AND ${parseFloat(arg.month.MonthEnd)}`
  if (arg.firm) query += ` AND Firm='${arg.firm}'`
  if (arg.worker) query += ` AND Worker_name='${arg.worker}'`
  query += ` ORDER BY Worker_name ASC`

  const result = []
  db.serialize(function () {
    db.each(`SELECT *
             FROM History
             WHERE Hours!='' AND Report_id IS NULL ${query}`, (err, rows) => {
      if (err) console.log(err)
      result.push(rows)
    }, () => {
      mainWindow.webContents.send("fetchHoursHistory:res", result);
    })
  });
});

ipcMain.on("update-hours", (event, arg) => {
  if (!arg.Report_id) {
    db.run(`UPDATE History
            SET Hours=${parseFloat(arg.Hours)},
                Firm='${arg.Firm}'
            WHERE Id = ${parseFloat(arg.Id)}`, (err) => {
      if (err) {
        console.log(err);
        event.returnValue = false
      } else {
        event.returnValue = true
      }
    });
  } else {
    event.returnValue = false
  }
});

// ========== Worker Info API ==========
ipcMain.on("fetchWorkerInfo", function (event, arg) {
  db.serialize(function () {
    db.each(`SELECT *
             FROM History
             WHERE Worker_id = ${parseFloat(arg)}
             ORDER BY Id`, (err, rows) => {
      mainWindow.webContents.send("fetchWorkerInfo:res", rows);
    });
    db.each(`SELECT *
             FROM Deposits
             WHERE Worker_id = ${parseFloat(arg)}
             ORDER BY Id`, (err, rows) => {
      mainWindow.webContents.send("fetchWorkerInfoDeposits:res", rows);
    });
    db.each(`SELECT *
             FROM Reports
             WHERE Worker_id = ${parseFloat(arg)}
             ORDER BY Id`, (err, rows) => {
      if (err) console.log(err);
      mainWindow.webContents.send("fetchWorkerInfoReports:res", rows);
    });
    db.each(`SELECT Name, Deposit
             FROM Workers
             WHERE Id = ${arg}`, (err, rows) => {
      mainWindow.webContents.send("fetchWorkerInfoCurrentDeposit:res", rows);
    })

  });
});
ipcMain.on("delete-history", function (event, arg) {
  db.serialize(function () {
    db.run(`DELETE
            FROM History
            WHERE Id = ${parseFloat(arg)}`, function (err) {
      if (err) {
        console.log(err);
        event.returnValue = false
      } else {
        event.returnValue = true
      }
    })
  });
});

// ========== Deposit API ==========
ipcMain.on("autocompleteWorkersDeposit", function () {
  const result = []
  db.serialize(function () {
    db.each(`SELECT Id, Name
             FROM Workers
             ORDER BY Name`, (err, rows) => {
      result.push(rows)
    }, () => {
      mainWindow.webContents.send("autocompleteWorkersDeposit:res", result);
    })
  });
});
ipcMain.on("add-deposit", function (event, arg) {
  let errors = [];
  console.log(arg);
  if (!arg.Comment) arg.Comment = ''

  db.serialize(function () {
    db.run(`INSERT into Deposits (Worker_id, Worker_name, Date, Money, Comment)
            values (${arg.Worker.Id}, '${arg.Worker.Name}', ${parseFloat(arg.Date)}, ${parseFloat(arg.Money)}, '${arg.Comment}')`, function (err) {
      if (err) {
        console.log(err);
        errors.push(err);
      }
    })
  });
  // Update current worker deposit
  db.each(`SELECT Deposit
           FROM Workers
           WHERE Id = ${parseFloat(arg.Worker.Id)}`, (err, rows) => {
    let deposit = rows['Deposit'];

    deposit ? deposit += parseFloat(arg.Money) : deposit = parseFloat(arg.Money);

    db.run(`UPDATE Workers
            SET Deposit=${deposit}
            WHERE Id = ${parseFloat(arg.Worker.Id)}`, (err) => {
      if (err) {
        console.log(err);
        errors.push(err);
      }
    });
  });

  errors.length > 0 ? event.returnValue = false : event.returnValue = true;

});
ipcMain.on("fetchCurrentDeposit", function (event, arg) {
  db.serialize(function () {
    db.each(`SELECT *
             FROM Deposits
             WHERE Id = ${arg}
             ORDER BY Id DESC`, (err, rows) => {
      mainWindow.webContents.send("fetchCurrentDeposit:res", rows);
    })
  });
});
ipcMain.on("fetchDepositHistory", function () {
  const result = []
  db.serialize(function () {
    db.each(`SELECT *
             FROM Deposits
             ORDER BY Id DESC`, (err, rows) => {
      if (err) console.log(err)
      result.push(rows)
    }, () => {
      mainWindow.webContents.send("fetchDepositHistory:res", result)
    })
  });
});
ipcMain.on("delete-deposit", function (event, arg) {
  db.serialize(function () {
    db.run(`DELETE
            FROM Deposits
            WHERE Id = ${parseFloat(arg.Id)}`, function (err) {
      if (err) {
        console.log(err);
        event.returnValue = false
      } else {
        if (!arg.Report_id) {
          db.run(`UPDATE Workers
                  SET Deposit= Deposit - ${parseFloat(arg.Money)}
                  WHERE Id = ${parseFloat(arg.Worker_id)}`, (err) => {
            if (err) {
              console.log(err);
              event.returnValue = false;
            } else {
              event.returnValue = true;
            }
          });
        } else {
          event.returnValue = true;
        }

      }
    })
  });
});
ipcMain.on("update-deposit", (event, arg) => {
  db.run(`UPDATE Deposits
          SET Date=${parseFloat(arg.Date)},
              Money=${parseFloat(arg.Money)},
              Comment='${arg.Comment}'
          WHERE Id = ${parseFloat(arg.Id)}`, (err) => {
    if (err) {
      console.log(err);
      event.returnValue = false
    } else {
      db.run(`UPDATE Workers
              SET Deposit= Deposit - ${parseFloat(arg.oldMoney) - parseFloat(arg.Money)}
              WHERE Id = ${parseFloat(arg.Worker_id)}`, (err) => {
        if (err) {
          console.log(err);
          event.returnValue = false
        } else {
          event.returnValue = true
        }
      });

    }
  });
});

// ========== Report API ==========


// Fetch workers for current month and firm, which don't receive salary
ipcMain.on("reportFetchWorkers", function (event, arg) {
  db.serialize(function () {
    db.each(`SELECT *
             FROM History
             WHERE Firm = '${arg.firm}' AND Month BETWEEN ${parseFloat(arg.start)} AND ${parseFloat(arg.end)} AND ifnull(Report_id, '') = ''
             ORDER BY Worker_name`, (err, rows) => {
      if (err) console.log(err)
      mainWindow.webContents.send("reportFetchWorkers:res", rows);
    })
  });
});
ipcMain.on("reportWorkerAutocomplete", function (event, arg) {
  console.log(arg)
  db.serialize(function () {
    db.all(`SELECT *
             FROM History
             WHERE ifnull(Report_id, '') = '' AND Month BETWEEN ${parseFloat(arg.start)} AND ${parseFloat(arg.end)} 
             ORDER BY Worker_name`, (err, rows) => {
      mainWindow.webContents.send("reportWorkerAutocomplete:res", rows);
    })
  });
});

ipcMain.on("reportWorkerData", function (event, arg) {
  db.serialize(function () {
    db.each(`SELECT History.Id, Worker_id, Worker_name, Month, Hours, History.Firm, Deposit, Rate
             FROM History INNER JOIN Workers
             on History.Worker_id=Workers.Id
             WHERE Workers.Id=${parseFloat(arg.Worker_id)}
               AND History.Month=${parseFloat(arg.Month)}
               AND History.Firm='${arg.Firm}'`, (err, rows) => {
      mainWindow.webContents.send("reportWorkerData:res", rows);
    })
  });
});

ipcMain.on("saveReport", function (event, arg) {
  db.serialize(function () {
    if (!arg.Other) arg.Other = 0;
    if (!arg.Insurance) arg.Insurance = 0;
    db.run(`INSERT into Reports (Worker_name, Worker_id, Firm, Month, Rate, Hours, Salary, Insurance, Deposit, Other,
                                 Total)
            values ('${arg.Worker_name}', '${arg.Worker_id}', '${arg.Firm}', ${parseFloat(arg.Month)},
                    ${parseFloat(arg.Rate)}, ${parseFloat(arg.Hours)}, ${parseFloat(arg.Salary)},
                    ${parseFloat(arg.Insurance)}, '${arg.Deposit}', ${parseFloat(arg.Other)},
                    ${parseFloat(arg.Total)})`, function (err) {
      if (err) console.log(err);
    });
    db.each(`SELECT Id
             From Reports
             WHERE Worker_id = ${arg.Worker_id} AND Firm = '${arg.Firm}' AND Month = ${parseFloat(arg.Month)}`, (err, rows) => {
      // arg.Id - current Hours item Id
      db.run(`UPDATE History
              SET Report_id=${rows.Id}
              WHERE Id = ${parseFloat(arg.Id)}`, (err) => {
        if (err) console.log(err);
      });
      db.run(`UPDATE Deposits
              SET Report_id=${rows.Id}
              WHERE Worker_id = ${parseFloat(arg.Worker_id)}
                AND ifnull(Report_id, '') = ''`, (err) => {
        if (err) console.log(err);
      });
    });
  });
});

// Update worker rate and deposit
ipcMain.on("newDepositRate", (event, arg) => {
  db.run(`UPDATE Workers
          SET Rate=${parseFloat(arg.Rate)},
              Deposit='${arg.Deposit}'
          WHERE Id = ${parseFloat(arg.Worker_id)}`, (err) => {
    if (err) console.log(err);

  });
});

// ======= Edit, Delete Hours and Deposit check =======

ipcMain.on("deposit-check-salary", function (event, arg) {
  db.serialize(function () {
    db.each(`SELECT Id
             FROM Reports
             WHERE Worker_id = '${arg.Worker_id}'
             ORDER BY Id DESC LIMIT 1`, (err, rows) => {
      if (rows) {
        if (rows.Id === arg.Report_id) {
          event.returnValue = 1
        } else {
          event.returnValue = 0;
        }
      } else {
        event.returnValue = 1;
      }
    })
  });
});

ipcMain.on("delete-report", function (event, arg) {
  db.serialize(function () {
    let errors = [],
      currentDeposit = 0;

    db.run(`DELETE
            FROM Reports
            WHERE Id = ${parseFloat(arg.Id)}`, function (err) {
      if (err) {
        errors.push(err);
        console.log(err)
      }
    });
    db.run(`UPDATE History
            SET Report_id=''
            WHERE Worker_id = ${arg.Worker_id} AND Firm = '${arg.Firm}' AND Month = ${parseFloat(arg.Month)}`, (err) => {
      if (err) errors.push(err);
    });
    db.run(`UPDATE Deposits
            SET Report_id=''
            WHERE Report_id = ${arg.Id}`, (err) => {
      if (err) errors.push(err);
    });

    if (parseFloat(arg.Total) === 0) {
      currentDeposit = arg.Salary - arg.Insurance;
    } else {
      currentDeposit = arg.Deposit;
    }
    db.run(`UPDATE Workers
            SET Deposit= Deposit + '${currentDeposit}'
            WHERE Id = ${parseFloat(arg.Worker_id)}`, (err) => {
      if (err) errors.push(err);
    });

    event.returnValue = errors.length <= 0;

  });
});

// ======= Default Page =======

ipcMain.on("getWorkersCount", function (event) {
  db.serialize(function () {
    db.each(`SELECT count(*)
             FROM Workers`, (err, rows) => {
      event.sender.send('getWorkersCount:res', rows['count(*)'])
    })
  });
});
ipcMain.on("getFirmsCount", function (event) {
  db.serialize(function () {
    db.each(`SELECT count(*)
             FROM Firms`, (err, rows) => {
      event.sender.send('getFirmsCount:res', rows['count(*)'])
    })
  });
});
