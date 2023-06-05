import sqlite3 from 'sqlite3';
import { log } from '../utils/logging.mjs';

const db = new sqlite3.Database(
  process.env.DB_PATH || (
    log.warn('Database Not Specified, Using default.db') ||
    'default.db'
  )
);

const STAT = {
  okay: 201,
  key_unavailable: 409,
  key_nonexistent: 404
};

db.run(`CREATE TABLE IF NOT EXISTS
  keys (
    key TEXT NOT NULL UNIQUE,
    owner TEXT,
    expires INT NOT NULL,
    config_path TEXT NOT NULL
  );`
);

const listKeys = () =>
  new Promise((resolve, reject) => {
    db.all(`SELECT * FROM keys`,
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  }
);

const checkKey = (key) =>
  new Promise((resolve, reject) => {
    db.get(`SELECT * FROM keys
      WHERE key = ?`, [key],
      (err, row) => {
        if (err) reject(err);
        if (row) resolve(true);
        else resolve(false);
      }
    );
  }
);

const addKey = (params) =>
  new Promise(async (resolve, reject) => {
    const key = params.key;
    if (await checkKey(key)) {
      return resolve(STAT.key_unavailable);
    }
    db.run(`INSERT INTO 
      keys (key, owner, expires, config_path) 
      VALUES (?, ?, ?, ?);`,
      [key, params.owner, params.expires, params.configPath],
      (err) => {
        if (err) reject(err);
        resolve(STAT.okay);
      }
    );
  }
);

const getByKey = (key) =>
  new Promise((resolve, reject) => {
    db.get(`SELECT * FROM keys
      WHERE key = ?`, [key],
      (err, row) => {
        if (err) reject(err);
        if (row) resolve(row);
        resolve(STAT.key_nonexistent);
      }
    );
  }
);

const deleteWithKey = (key) =>
  new Promise((resolve, reject) => {
    db.run(`DELETE FROM keys
      WHERE key = ?`, [key],
      (err) => {
        if (err) reject(err);
        resolve(STAT.okay);
      }
    );
  }
);

export default {
  STAT, listKeys, checkKey, addKey, getByKey, deleteWithKey
}