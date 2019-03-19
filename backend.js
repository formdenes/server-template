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
  const shortUrl = getShortUrlByAlias(req.params.alias);

  if (shortUrl.length > 0) {
    increaseHitCountByAlias(shortUrl[0].alias);
    res.redirect(shortUrl[0].url);
  } else {
    sendStatus(res, 404);
  }
});

app.get('/a/links', (req, res) => {
  const shortUrls = getShortUrlsNoSecret();
  res.status(200).send(shortUrls);
});

app.post('/api/links', (req, res) => {
  const { url, alias } = req.body;

  if (
    isAliasAvailable(alias) === true &&
    createShortUrl(url, alias) === true
  ) {
    const resultData = getShortUrlByAlias(alias);

    if (resultData.length < 1) {
      sendStatus(res, 400);
    } else {
      res.status(200).send(resultData[0]);
    }

  } else {
    sendStatus(res, 400);
  }
});

app.delete('/api/links/:id', (req, res) => {
  const id = req.params.id;
  const secretCode = req.body.secretCode;
  const shortUrl = getShortUrlById(id)[0];

  if (shortUrl.length < 1) {
    sendStatus(res, 404);
  } else if (
    shortUrl.length > 0 && 
    shortUrl.secretCode !== secretCode
  ) {
    sendStatus(res, 403);
  } else if (
    shortUrl.length > 0 && 
    shortUrl.secretCode === secretCode &&
    deleteShortUrlById(id)
  ) {
    sendStatus(res, 204);
  } else {
    sendStatus(res, 500);
  }
})

function sendStatus(res, statusCode) {
  res.status(statusCode).send();
}

function isAliasAvailable(alias) {
  const aliases = getShortUrlByAlias(alias) || null;
  return aliases === null ? false : aliases.length === 0;
}

function getShortUrlByAlias(alias) {
  connection.query(
    'SELECT * FROM shorturls WHERE alias = ?',
    [alias || ''],
    (err, rows) => {
      if (err) {
        console.error(err);
        return [];
      }

      return rows || [];
    },
  );
}

function getShortUrlById(id) {
  connection.query(
    'SELECT * FROM shorturls WHERE id = ?',
    [id || ''],
    (err, rows) => {
      if (err) {
        console.error(err);
        return [];
      }

      return rows || [];
    },
  );
}

function createShortUrl(url, alias) {
  connection.query(
    'INSERT INTO shorturls (url, alias, secretCode) VALUES (?, ?, ?)',
    [url, alias, generateSecretCode()],
    (err, rows) => {
      if (err) {
        console.error(err);
        return false;
      }

      return true;
    },
  );
}

function deleteShortUrlById(id){
  connection.query(
    'DELETE FROM shorturls WHERE id = ?',
    [id],
    (err, rows) => {
      if (err) {
        console.error(err);
        return false;
      }

      return true;
    },
  );
}

function increaseHitCountByAlias(alias) {
  connection.query(
    'UPDATE shorturls SET hitcount = hitcount + 1 WHERE alias = ?',
    [alias || ''],
    (err, rows) => {
      if (err) {
        console.error(err);
        return false;
      }

      return true;
    },
  );
}

function getShortUrlsNoSecret() {
  connection.query(
    'SELECT id, url, alias, hitcount FROM shorturls',
    (err, rows) => {
      if (err) {
        console.error(err);
        return [];
      }

      return rows;
    },
  );
}

function generateSecretCode() {
  return `${getARandomNumber(0, 9)}${getARandomNumber(0, 9)}${getARandomNumber(0, 9)}${getARandomNumber(0, 9)}`;
}

function getARandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}