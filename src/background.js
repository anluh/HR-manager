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
    db.each(`SELECT * FROM Workers ORDER BY Id DESC LIMIT ${arg.perPage} OFFSET ${pageOffset}`, (err, rows) => {
      let response = {};
      response.totalItems = totalItems;
      response.rows = rows;
      mainWindow.webContents.send("printWorkers:res", response);
    })
  });

});

ipcMain.on("autocompleteWorkers", (event, arg) => {
  db.serialize(function(){
    db.each(`SELECT Id, Name FROM Workers WHERE (${parseFloat(arg.MonthStart)} > Start OR ${parseFloat(arg.MonthEnd)} > Start) AND (${parseFloat(arg.MonthStart)} < End)`, (err, rows) => {
      mainWindow.webContents.send("autocompleteWorkers:res", rows);
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
        db.each(`SELECT count(*) FROM Workers WHERE ${filter.key} = '${filter.value}' AND Active = ${parseFloat(arg.filterBy.Active)}`, (err, rows) => {
          totalItems = rows['count(*)'];
        });
        db.each(`SELECT * FROM Workers WHERE ${filter.key} = '${filter.value}' AND Active = ${parseFloat(arg.filterBy.Active)} ORDER BY Id DESC LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
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
        db.each(`SELECT * FROM Workers WHERE ${filter.key} = '${filter.value}' ORDER BY Id DESC LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
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
        db.each(`SELECT count(*) FROM Workers WHERE ${dateFilter} AND Active = ${parseFloat(arg.filterBy.Active)}`, (err, rows) => {
          totalItems = rows['count(*)'];
        });
        db.each(`SELECT * FROM Workers WHERE ${dateFilter} AND Active = ${parseFloat(arg.filterBy.Active)} ORDER BY Id DESC LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
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
        db.each(`SELECT * FROM Workers WHERE ${dateFilter} ORDER BY Id DESC LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
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
    db.each(`SELECT count(*) FROM Workers WHERE Active = ${parseFloat(arg.filterBy.Active)}`, (err, rows) => {
      totalItems = rows['count(*)'];
    });
    db.each(`SELECT * FROM Workers WHERE Active = ${parseFloat(arg.filterBy.Active)} ORDER BY Id DESC LIMIT ${arg.pagination.perPage} OFFSET ${pageOffset}`, (err, rows) => {
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
  if(!arg.End){
    arg.End = null
  }

  db.serialize(function () {
    db.run(`INSERT into Workers (Name, Age, Sex, Firm, Firm_id, Start, End, Active) values('${arg.Name}', '${arg.Age}', '${arg.Sex}', '${arg.Firm.Name}', ${arg.Firm.Id}, '${arg.Start}', '${arg.End}', ${parseFloat(arg.Active)})`, function(err){
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
    db.run(`INSERT into Firms (Name, Address, Active) values('${arg.Name}', '${arg.Address}', ${parseFloat(arg.Active)})`, function(err){
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

    if (check > 0 && parseFloat(arg.Active) === 0) {
      errors.push('workers_err');

    } else {
      db.run(`UPDATE Firms SET Name='${arg.Name}', Address='${arg.Address}', Active=${parseFloat(arg.Active)} WHERE Id=${parseFloat(arg.Id)}`, (err) => {
        if (err) {
          errors.push(err);
        }
      });
      db.run(`UPDATE Workers SET Firm='${arg.Name}' WHERE Firm_id=${parseFloat(arg.Id)}`, (err) => {
        if (err) {
          errors.push(err);
        }
      });
    }

    errors.length > 0 ? event.returnValue = false : event.returnValue = true;
  });

});

ipcMain.on("edit-worker", (event, arg) => {
  if(!arg.End){
    arg.End = null
  }
  db.run(`UPDATE Workers SET Name='${arg.Name}', Age='${arg.Age}', Sex='${arg.Sex}', Firm='${arg.Firm.Name}', Firm_id=${arg.Firm.Id}, Start='${arg.Start}', End='${arg.End}', Active=${parseFloat(arg.Active)} WHERE Id=${parseFloat(arg.Id)}`, (err) => {
    if (err) {
      console.log(err)
      event.returnValue = false
    } else {
      event.returnValue = true
    }
  });
});

// ============= Salary API ==============
ipcMain.on("add-salary", function (event, arg){
  db.serialize(function () {
    // If hours added to worker in current month -> show err
    db.each(`SELECT count(*) FROM History WHERE Worker_id=${arg.Worker.Id} AND Firm='${arg.Firm}' AND Month=${parseFloat(arg.MonthStart)}`, (err, rows) => {
      if(rows['count(*)'] > 0){
        event.returnValue = 'err_exist'
      } else {
        db.run(`INSERT into History (Worker_id, Worker_name, Month, Hours, Firm) values(${arg.Worker.Id}, '${arg.Worker.Name}', ${parseFloat(arg.MonthStart)}, '${arg.Hours}', '${arg.Firm}')`, function(err){
          if(err){
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

ipcMain.on("fetchSalaryHistory", function(event, arg) {
  let query = '';
  if (arg){
    query = `AND Month = ${parseFloat(arg)} ORDER BY Id DESC`
  } else {
    query = `ORDER BY Id DESC LIMIT 20`
  }
  db.serialize(function(){
    db.each(`SELECT * FROM History WHERE Hours != '' ${query}`, (err, rows) => {
      mainWindow.webContents.send("fetchSalaryHistory:res", rows);
    })
  });
});

ipcMain.on("update-hours", (event, arg) => {
  db.run(`UPDATE History SET Hours=${parseFloat(arg.Hours)}, Firm='${arg.Firm}' WHERE Id=${parseFloat(arg.Id)}`, (err) => {
    if (err) {
      console.log(err);
      event.returnValue = false
    } else {
      if(arg.Report_id) {
        db.each(`SELECT Rate, Deposit FROM Reports WHERE Id=${parseFloat(arg.Report_id)}`, (error, rows) => {
          let errors= [];

          if(error){
            console.log(error);
            errors.push(error)
          } else {

            let hours = arg.Hours,
              rate = rows.Rate,
              deposit = rows.Deposit,
              insurance = 0,
              endTotal = 0,
              currentDeposit = 0;

            if (hours >= 0 && hours <= 100) {
              insurance = 100
            } else if (hours > 100 && hours <= 170) {
              insurance = 150
            } else if (hours > 170) {
              insurance = 200
            }

            let total = rate * hours - insurance - deposit;
            let salary = rate * hours;

            if (total > 0) {
              endTotal = total;
              currentDeposit = 0;
            } else {
              endTotal = 0;
              currentDeposit = deposit - salary + insurance;
            }

            db.run(`UPDATE Reports SET Hours=${hours}, Salary=${salary}, Insurance=${insurance}, Total=${endTotal} WHERE Id=${parseFloat(arg.Report_id)}`, (err) => {
              if (err) {
                console.log(err);
                errors.push(err);
              }
            });
            db.run(`UPDATE Workers SET Deposit=${currentDeposit} WHERE Id=${parseFloat(arg.Worker.Id)}`, (err) => {
              if (err) {
                console.log(err);
                errors.push(err);
              }
            });
          }

          errors.length > 0 ? event.returnValue = false : event.returnValue = true;

        });

      } else { // If arg.Report_id exist
        event.returnValue = true
      }
    }
  });
});

// ========== Worker Info API ==========
ipcMain.on("fetchWorkerInfo", function(event, arg) {
  db.serialize(function(){
    db.each(`SELECT * FROM History WHERE Worker_id = ${parseFloat(arg)} ORDER BY Id`, (err, rows) => {
      mainWindow.webContents.send("fetchWorkerInfo:res", rows);
    });
    db.each(`SELECT * FROM Deposits WHERE Worker_id = ${parseFloat(arg)} ORDER BY Id`, (err, rows) => {
      mainWindow.webContents.send("fetchWorkerInfoDeposits:res", rows);
    });
    db.each(`SELECT * FROM Reports WHERE Worker_id = ${parseFloat(arg)} ORDER BY Id`, (err, rows) => {
      if(err) console.log(err);
      mainWindow.webContents.send("fetchWorkerInfoReports:res", rows);
    });
    db.each(`SELECT Name, Deposit FROM Workers WHERE Id = ${arg}`, (err, rows) => {
      mainWindow.webContents.send("fetchWorkerInfoCurrentDeposit:res", rows);
    })

  });
});
ipcMain.on("delete-history", function(event, arg) {
  db.serialize(function(){
    db.run(`DELETE FROM History WHERE Id=${parseFloat(arg)}`, function (err) {
      if(err){
        console.log(err);
        event.returnValue = false
      } else {
        event.returnValue = true
      }
    })
  });
});

// ========== Deposit API ==========
ipcMain.on("autocompleteWorkersDeposit", function() {
  db.serialize(function(){
    db.each(`SELECT Id, Name FROM Workers ORDER BY Name`, (err, rows) => {
      mainWindow.webContents.send("autocompleteWorkersDeposit:res", rows);
    })
  });
});
ipcMain.on("add-deposit", function (event, arg){
  let errors = [];

  db.serialize(function () {
    db.run(`INSERT into Deposits (Worker_id, Worker_name, Date, Money) values(${arg.Worker.Id}, '${arg.Worker.Name}', ${parseFloat(arg.Date)}, ${parseFloat(arg.Money)})`, function(err){
      if(err){
        console.log(err);
        errors.push(err)
      }
    })
  });
  // Update current worker deposit
  db.each(`SELECT Deposit FROM Workers WHERE Id=${parseFloat(arg.Worker.Id)}`, (err, rows) => {
    let deposit = rows['Deposit'];

    deposit ? deposit += parseFloat(arg.Money) : deposit = parseFloat(arg.Money);

    db.run(`UPDATE Workers SET Deposit=${deposit} WHERE Id=${parseFloat(arg.Worker.Id)}`, (err) => {
      if (err) {
        console.log(err);
        errors.push(err);
      }
    });
  });

  errors.length > 0 ? event.returnValue = false : event.returnValue = true;

});
ipcMain.on("fetchCurrentDeposit", function(event, arg) {
  db.serialize(function(){
    db.each(`SELECT * FROM Deposits WHERE Id=${arg} ORDER BY Id DESC`, (err, rows) => {
      mainWindow.webContents.send("fetchCurrentDeposit:res", rows);
    })
  });
});
ipcMain.on("fetchDepositHistory", function() {
  db.serialize(function(){
    db.each(`SELECT * FROM Deposits ORDER BY Id DESC`, (err, rows) => {
      mainWindow.webContents.send("fetchDepositHistory:res", rows);
    })
  });
});
ipcMain.on("delete-deposit", function(event, arg) {
  db.serialize(function(){
    db.run(`DELETE FROM Deposits WHERE Id=${parseFloat(arg.Id)}`, function (err) {
      if(err){
        console.log(err);
        event.returnValue = false
      } else {
        if (!arg.Report_id) {
          db.run(`UPDATE Workers SET Deposit= Deposit - ${parseFloat(arg.Money)} WHERE Id=${parseFloat(arg.Worker_id)}`, (err) => {
            if (err) {
              console.log(err);
              event.returnValue = false;
            } else {
              event.returnValue = true;
            }
          });
        } else {
          let errors = [];

          db.each(`SELECT Salary, Insurance, Deposit, Total FROM Reports WHERE Id=${arg.Report_id}`, (err, result) => {
            if (err) {
              console.log(err);
              errors.push(err);
            } else {
              let deposit = result.Deposit - arg.Money;
              let total = result.Salary - result.Insurance - deposit;
              let currentDeposit = 0;
              let endTotal = 0;

              if (total > 0) {
                currentDeposit = 0
                endTotal = total;
              } else {
                currentDeposit = deposit - result.Salary + result.Insurance;
                endTotal = 0;
              }

              db.run(`UPDATE Reports SET Deposit='${deposit}', Total=${endTotal} WHERE Id=${arg.Report_id}`, (err) => {
                if (err) {
                  console.log(err);
                  errors.push(err);
                }
              });
              db.run(`UPDATE Workers SET Deposit='${currentDeposit}' WHERE Id=${arg.Worker_id}`, (err) => {
                if (err) {
                  console.log(err);
                  errors.push(err);
                }
              });

              errors.length > 0 ? event.returnValue = false : event.returnValue = true;
            }
          });
        }



      }
    })
  });
});
ipcMain.on("update-deposit", (event, arg) => {
  db.run(`UPDATE Deposits SET Date=${parseFloat(arg.Date)}, Money=${parseFloat(arg.Money)} WHERE Id=${parseFloat(arg.Id)}`, (err) => {
    if (err) {
      console.log(err);
      event.returnValue = false
    } else {
      if(!arg.Report_id) {
        db.run(`UPDATE Workers SET Deposit= Deposit - ${parseFloat(arg.oldMoney) - parseFloat(arg.Money)} WHERE Id=${parseFloat(arg.Worker_id)}`, (err) => {
          if (err) {
            console.log(err);
            event.returnValue = false
          } else {
            event.returnValue = true
          }
        });
      } else {
        let
          currentDeposit = 0,
          afterSalaryDeposit = 0,
          endTotal =0,
          total = 0,
          errors= [];

        let depLastSalary = 0;

        db.each(`SELECT * FROM Reports WHERE Id=${parseFloat(arg.Report_id)}`, (err, result) => {

          db.each(`SELECT Money FROM Deposits WHERE Report_id=${parseFloat(arg.Report_id)}`, (err, dep) => {
            if(dep) depLastSalary += dep.Money
          }, () => {

            total = result.Salary - result.Insurance - depLastSalary;

            if (total > 0) {
              currentDeposit = 0;
              endTotal = total;
            } else {
              currentDeposit = depLastSalary - result.Salary + result.Insurance;
              endTotal = 0;
            }

            db.each(`SELECT Money FROM Deposits WHERE Worker_id=${arg.Worker_id} AND ifnull(Report_id, '') = ''`, (err, result) => {
              afterSalaryDeposit += result.Money;
            }, () => {
              let workerDeposit = currentDeposit + afterSalaryDeposit;
              db.run(`UPDATE Reports SET Deposit='${depLastSalary}', Total=${endTotal} WHERE Id=${arg.Report_id}`, (err) => {
                if (err) {
                  console.log(err);
                  errors.push(err);
                }
              });
              db.run(`UPDATE Workers SET Deposit= '${workerDeposit}' WHERE Id=${arg.Worker_id}`, (err) => {

                if (err) {
                  console.log(err);
                  errors.push(err);
                }
              });
            });

            errors.length > 0 ? event.returnValue = false : event.returnValue = true;

          });

        });

      }

    }
  });
});

// ========== Report API ==========


// Fetch workers for current month and firm, which don't receive salary
ipcMain.on("reportFetchWorkers", function(event, arg) {
  db.serialize(function(){
    db.each(`SELECT * FROM History WHERE Firm='${arg.Firm}' AND Month=${parseFloat(arg.Month)} AND ifnull(Report_id, '') = '' ORDER BY Worker_name`, (err, rows) => {
      mainWindow.webContents.send("reportFetchWorkers:res", rows);
    })
  });
});
ipcMain.on("reportWorkerAutocomplete", function(event, arg) {
  db.serialize(function(){
    db.each(`SELECT * FROM History WHERE Month=${parseFloat(arg)} AND ifnull(Report_id, '') = '' ORDER BY Worker_name`, (err, rows) => {
      mainWindow.webContents.send("reportWorkerAutocomplete:res", rows);
    })
  });
});

ipcMain.on("reportWorkerData", function(event, arg) {
  db.serialize(function(){
    db.each(`SELECT History.Id, Worker_id, Worker_name, Month, Hours, History.Firm, Deposit, Rate FROM History INNER JOIN Workers on History.Worker_id=Workers.Id WHERE Workers.Id=${parseFloat(arg.Worker_id)} AND History.Month=${parseFloat(arg.Month)} AND History.Firm='${arg.Firm}'`, (err, rows) => {
      mainWindow.webContents.send("reportWorkerData:res", rows);
    })
  });
});

ipcMain.on("saveReport", function (event, arg){
  db.serialize(function () {
    db.run(`INSERT into Reports (Worker_name, Worker_id, Firm, Month, Rate, Hours, Salary, Insurance, Deposit, Total) values('${arg.Worker_name}', '${arg.Worker_id}', '${arg.Firm}', ${parseFloat(arg.Month)}, ${parseFloat(arg.Rate)}, ${parseFloat(arg.Hours)}, ${parseFloat(arg.Salary)}, ${parseFloat(arg.Insurance)}, '${arg.Deposit}', ${parseFloat(arg.Total)})`, function(err){
      if(err) console.log(err);
    });
    db.each(`SELECT Id From Reports WHERE Worker_id=${arg.Worker_id} AND Firm='${arg.Firm}' AND Month=${parseFloat(arg.Month)}`, (err, rows) => {
      // arg.Id - current Hours item Id
      db.run(`UPDATE History SET Report_id=${rows.Id} WHERE Id=${parseFloat(arg.Id)}`, (err) => {
        if (err) console.log(err);
      });
      db.run(`UPDATE Deposits SET Report_id=${rows.Id} WHERE Worker_id=${parseFloat(arg.Worker_id)} AND ifnull(Report_id, '') = ''`, (err) => {
        if (err) console.log(err);
      });
    });
  });
});

// Update worker rate and deposit
ipcMain.on("newDepositRate", (event, arg) => {
  db.run(`UPDATE Workers SET Rate=${parseFloat(arg.Rate)}, Deposit='${arg.Deposit}' WHERE Id=${parseFloat(arg.Worker_id)}`, (err) => {
    if (err) console.log(err);

  });
});

// ======= Edit, Delete Hours and Deposit check =======

ipcMain.on("hours-check-salary", function(event, arg) {
  db.serialize(function(){
    db.each(`SELECT Id FROM Reports WHERE Worker_id='${arg.Worker_id}' ORDER BY Id DESC LIMIT 1`, (err, rows) => {
      if(rows) {
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
ipcMain.on("deposit-check-salary", function(event, arg) {
  db.serialize(function(){
    db.each(`SELECT Id FROM Reports WHERE Worker_id='${arg.Worker_id}' ORDER BY Id DESC LIMIT 1`, (err, rows) => {
      if(rows) {
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

ipcMain.on("delete-report", function(event, arg) {
  db.serialize(function(){
    let errors= [],
      currentDeposit = 0;

    db.run(`DELETE FROM Reports WHERE Id=${parseFloat(arg.Id)}`, function (err) {
      if(err) {
        errors.push(err);
        console.log(err)
      }
    });
    db.run(`UPDATE History SET Report_id='' WHERE Worker_id=${arg.Worker_id} AND Firm='${arg.Firm}' AND Month=${parseFloat(arg.Month)}`, (err) => {
      if (err) errors.push(err);
    });
    db.run(`UPDATE Deposits SET Report_id='' WHERE Report_id=${arg.Id}`, (err) => {
      if (err) errors.push(err);
    });

    db.each(`SELECT Money from Deposits WHERE Worker_id=${arg.Worker_id} AND ifnull(Report_id, '') = ''`, (err, result) => {
      currentDeposit += parseFloat(result.Money);
    }, () => {
      db.run(`UPDATE Workers SET Deposit='${currentDeposit}' WHERE Id=${parseFloat(arg.Worker_id)}`, (err) => {
        if (err) errors.push(err);
      });

      event.returnValue = errors.length <= 0;
    });



  });
});

// ======= Default Page =======

ipcMain.on("getWorkersCount", function(event) {
  db.serialize(function(){
    db.each(`SELECT count(*) FROM Workers`, (err, rows) => {
      event.sender.send('getWorkersCount:res', rows['count(*)'])
    })
  });
});
ipcMain.on("getFirmsCount", function(event) {
  db.serialize(function(){
    db.each(`SELECT count(*) FROM Firms`, (err, rows) => {
      event.sender.send('getFirmsCount:res', rows['count(*)'])
    })
  });
});
