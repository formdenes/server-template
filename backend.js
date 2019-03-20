'use strict';

const dotenv = require('dotenv');
const express = require('express');
const database = require('./database');

const connection = database.connection;

const app = express();
const APP_PORT = process.env.APP_PORT;

dotenv.config();

app.use(express.json());
app.use(express.static('frontend-assets'));

app.listen(APP_PORT, () => {
  console.log(`Server is running at ${APP_PORT}`);
  console.log(`Database is ${connection === null ? 'NOT ' : ''}available`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend-assets/index.html'));
});

app.get('/a/:alias', (req, res) => {
  // chechk for existing alias
  connection.query(
    'SELECT * FROM shorturls WHERE alias = ?',
    [alias || ''],
    (err, rows) => {
      if (err) {
        console.error(err);
      } else if (rows.length > 0) { // exists the alias
        // increase hitcount
        connection.query(
          'UPDATE shorturls SET hitcount = hitcount + 1 WHERE alias = ?',
          [rows[0].alias || ''],
          (err, rows) => {
            if (err) {
              console.error(err);
            } else {
              // redirect to the target page
              res.redirect(rows[0].url);
            }
          },
        );
      } else { // alias is not present
        res.status(404).send();
      }
    },
  );
});

app.get('/a/links', (req, res) => {
  // grab all the information without the secret code
  connection.query(
    'SELECT id, url, alias, hitcount FROM shorturls',
    (err, rows) => {
      if (err) {
        console.error(err);
      } else {
        res.status(200).send(rows);
      }
    },
  );
});

app.post('/api/links', (req, res) => {
  const { url, alias } = req.body;

  // check if alias is available
  connection.query(
    'SELECT * FROM shorturls WHERE alias = ?',
    [alias || ''],
    (err, rows) => {
      if (err) {
        console.error(err);
      } else if (rows.length > 0) {
        // alias is already taken
        res.status(400).send();
      } else {
        // create new shorturl
        connection.query(
          'INSERT INTO shorturls (url, alias, secretCode) VALUES (?, ?, ?)',
          [url, alias, generateSecretCode()],
          (err, rows) => {
            if (err) {
              console.error(err);
            } else {
              // read back the created shorturl
              connection.query(
                'SELECT * FROM shorturls WHERE alias = ?',
                [alias || ''],
                (err, rows) => {
                  if (err) {
                    console.error(err);
                  } else {
                    res.status(200).send(rows[0]);
                  }
                },
              );
            }
          },
        );
      }
    },
  );
});

app.delete('/api/links/:id', (req, res) => {
  const id = req.params.id;
  const secretCode = req.body.secretCode;

  connection.query(
    'SELECT * FROM shorturls WHERE id = ?',
    [id || ''],
    (err, rows) => {
      if (err) {
        console.error(err);
      } else if (rows.length < 1) {
        res.status(404).send();
      } else if(rows.length > 0 && rows[0].secretCode !== secretCode) {
        res.status(403).send();
      } else if (rows.length > 0 && rows[0].secretCode === secretCode) {
        // delete shorturl
        connection.query(
          'DELETE FROM shorturls WHERE id = ?',
          [id],
          (err, rows) => {
            if (err) {
              console.error(err);
            } else {
              res.status(204).send();
            }
          },
        );
      } else {
        res.status(500).send();
      }
    },
  );
});

function generateSecretCode() {
  return `${getARandomNumber(0, 9)}${getARandomNumber(0, 9)}${getARandomNumber(0, 9)}${getARandomNumber(0, 9)}`;
}

function getARandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}