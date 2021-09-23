import fs from 'fs'
import path from 'path'
import electron from 'electron'
const { ipcRenderer } = electron;
let sqlite3 = require('sqlite3').verbose();

let dbPath = path.dirname((electron.app || electron.remote.app).getPath("exe"))
let dbFile = path.join(dbPath, 'database.sqlite')

const dbRunPromise = (db, sql_query) =>  new Promise((resolve, reject) => {
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

function dateFormat(t, a, s) {
  function format(m) {
    let f = new Intl.DateTimeFormat('en', m);
    return f.format(t);
  }
  return a.map(format).join(s);
}

function CreateDatabase(db, callback) {
  db.serialize(async function () {
    await dbRunPromise(db, `CREATE TABLE IF NOT EXISTS Deposits
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
    await dbRunPromise(db, `CREATE TABLE IF NOT EXISTS  Firms
            (
                \`Id\`      INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
                \`Name\`    TEXT    NOT NULL UNIQUE,
                \`Address\` TEXT    NOT NULL,
                \`Active\`  INTEGER NOT NULL
            )`
    )
    await dbRunPromise(db, `CREATE TABLE IF NOT EXISTS  History
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
    await dbRunPromise(db,`CREATE TABLE IF NOT EXISTS Reports (
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
    await dbRunPromise(db,`CREATE TABLE IF NOT EXISTS Workers (
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

// Create default database if not exist on app start
export function CreateDefaultDataBase() {
  let db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) console.error(err.message)
  });
  CreateDatabase(db, () => {
    ipcRenderer.send('ChangeCurrentDB');
  })
}

export async function CreateNewDataBase(cb) {
  let dumpPath = dbPath + '/dumps'
  if (!fs.existsSync(dumpPath)) fs.mkdir(dumpPath, (err) => {
    if (err) return console.log(err)
  })

  const a = [{day: '2-digit'}, {month: '2-digit'}, {year: '2-digit'}];
  const b = [{hour: '2-digit'}, {minute: '2-digit'}, {second: '2-digit'}];
  const fileName = dateFormat(new Date, a, '-') + "-" + dateFormat(new Date, b, ':');
  const dumpFilePath = path.join(dumpPath, fileName + '.sqlite')

  fs.copyFile(dbFile, dumpFilePath, (err) => {
    if (err) throw err
  })

  let db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE, (err) => {
    if (err) console.error(err.message)
  });

  await db.serialize(function () {
    dbRunPromise(db, `DROP TABLE IF EXISTS Deposits;`)
    dbRunPromise(db, `DROP TABLE IF EXISTS History;`)
    dbRunPromise(db, `DROP TABLE IF EXISTS Reports;`)
    dbRunPromise(db, `UPDATE Workers SET Deposit=0`)
  })

  CreateDatabase(db, () => {
    cb()
  })

}

export function ImportDataBase(newDb) {
  if (!newDb) return false

  fs.unlink(dbFile, (err) => {
    if (err) console.log(err)
  })

  fs.copyFile(newDb, dbFile, (err) => {
    if (err) throw err
    console.log('DB copied')
    ipcRenderer.send('ChangeCurrentDB');
  })
}

export function ExportDataBase(newDb) {
  if (!newDb) return false

  fs.copyFile(dbFile, newDb, (err) => {
    return err ? err : true
  })
}
