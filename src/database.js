import fs from 'fs'
import path from 'path'
import electron from 'electron'
const { ipcRenderer } = electron;
let sqlite3 = require('sqlite3').verbose();

const CreateTable = (db, sql_query) =>  new Promise((resolve, reject) => {
    try {
      db.run(sql_query, (err) => {
        if (err) reject(err)
        resolve()
      })
    } catch (err) {
      console.error('Failed to create database table: ', err)
      reject()
    }
  })



function CreateDatabase(db, callback) {
  db.serialize(async function () {
    await CreateTable(db, `CREATE TABLE IF NOT EXISTS Deposits
            (
                \`Id\`          INTEGER NOT NULL,
                \`Worker_id\`   INTEGER NOT NULL,
                \`Worker_name\` TEXT    NOT NULL,
                \`Date\`        NUMERIC NOT NULL,
                \`Money\`       INTEGER NOT NULL,
                \`Report_id\`   INTEGER,
                \`Comment\`     TEXT,
                PRIMARY KEY (Id)
            )`
    )

    await CreateTable(db, `CREATE TABLE IF NOT EXISTS  Firms
            (
                \`Id\`      INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
                \`Name\`    TEXT    NOT NULL UNIQUE,
                \`Address\` TEXT    NOT NULL,
                \`Active\`  INTEGER NOT NULL
            )`
    )

    await CreateTable(db, `CREATE TABLE IF NOT EXISTS  History
            (
                \`Id\`          INTEGER NOT NULL,
                \`Worker_id\`   INTEGER NOT NULL,
                \`Worker_name\` TEXT    NOT NULL,
                \`Month\`       INTEGER NOT NULL,
                \`Hours\`       INTEGER,
                \`Firm\`        TEXT    NOT NULL,
                \`Report_id\`   INTEGER,
                PRIMARY KEY (Id)
            )`
    )

    await CreateTable(db,`CREATE TABLE IF NOT EXISTS Reports (
          \t\`Id\`\tINTEGER NOT NULL,
          \t\`Worker_name\`\tTEXT NOT NULL,
          \t\`Worker_id\`\tTEXT NOT NULL,
          \t\`Firm\`\tTEXT NOT NULL,
          \t\`Month\`\tINTEGER NOT NULL,
          \t\`Rate\`\tNUMERIC NOT NULL,
          \t\`Hours\`\tNUMERIC NOT NULL,
          \t\`Salary\`\tNUMERIC NOT NULL,
          \t\`Insurance\`\tINTEGER NOT NULL,
          \t\`Deposit\`\tTEXT,
          \t\`Other\`\tNUMERIC,
          \t\`Total\`\tNUMERIC NOT NULL,
          \tPRIMARY KEY(Id)
          )`
    )

    await CreateTable(db,`CREATE TABLE IF NOT EXISTS Workers (
          \t\`Id\`\tINTEGER NOT NULL UNIQUE,
          \t\`Name\`\tTEXT NOT NULL,
          \t\`Age\`\tTEXT,
          \t\`Sex\`\tTEXT NOT NULL,
          \t\`Firm\`\tTEXT,
          \t\`Firm_id\`\tINTEGER,
          \t\`Start\`\tNUMERIC NOT NULL,
          \t\`End\`\tNUMERIC,
          \t\`Active\`\tINTEGER NOT NULL,
          \t\`Deposit\`\tNUMERIC,
          \t\`Rate\`\tNUMERIC,
          \tPRIMARY KEY(Id)
          )`
    )

    callback()
  })

}

export function CreateDefaultDataBase() {
  let filePath = path.dirname((electron.app || electron.remote.app).getPath("exe"))
  let file = path.join(filePath, 'database.sqlite')

  let db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) console.error(err.message)
  });

  CreateDatabase(db, () => {
    console.log('Promises ended')
    ipcRenderer.send('ChangeCurrentDB');
  })
}

export function CreateNewDataBase() {
  let filePath = path.dirname(require('electron').remote.app.getPath("exe")) + '/dumps'
  if (!fs.existsSync(filePath)) fs.mkdir(filePath, (err) => {
    if (err) return console.log(err)
  })

  function join(t, a, s) {
    function format(m) {
      let f = new Intl.DateTimeFormat('en', m);
      return f.format(t);
    }
    return a.map(format).join(s);
  }

  let a = [{day: 'numeric'}, {month: 'numeric'}, {year: 'numeric'}];
  let fileName = join(new Date, a, '-') + "-" + +new Date();

  let file = path.join(filePath, fileName + '.sqlite')

  let db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) console.error(err.message)
  });

  CreateDatabase(db)

  // ipcRenderer.send('ChangeCurrentDB');

}
