const express = require('express');
const { v4: uuid } = require('uuid');
const { isWebUri } = require('valid-url');
const logger = require('../logger');
const store = require('../store');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    res.json(store.bookmarks);
  })
  .post(bodyParser, (req, res) => {
    ['title', 'url', 'rating'].forEach((key) => {
      if (!req.body[key]) {
        logger.error(`${key} is required.`);
        return res.status(400).send(`${key} is required`);
      }
    });

    const {
      title, url, description, rating
    } = req.body;

    if (!Number.isInteger(rating) || rating > 5 || rating < 0) {
      logger.error(`Invalid rating: ${rating}`);
      return res.status(400).send(`Invalid rating: ${rating}, must be a number between 0 and 5`);
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid URL: '${url}'`);
      return res.status(400).send(`Invalid URL: ${url}, valid URL must be supplied.`);
    }

    const newBookmark = {
      id: uuid(), title, url, description, rating
    };

    store.bookmarks.push(newBookmark);

    logger.info(`Added new bookmark with id ${newBookmark.id}`);

    res.status(201)
      .location(`http://localhost:8000/bookmarks/${newBookmark.id}`)
      .json(newBookmark);
  });

bookmarkRouter
  .route('/bookmarks/:bookmarkId')
  .get((req, res) => {
    const { bookmarkId } = req.params;

    const bookmarkFound = store.bookmarks.find((bookmark) => bookmark.id == bookmarkId);

    if (!bookmarkFound) {
      logger.error(`Bookmark with id: ${bookmarkId} not found`);
      return res.status(400).send('Bookmark not found');
    }

    res.json(bookmarkFound);
  })
  .delete((req, res) => {
    const { bookmarkId } = req.params;

    const bookmarkIndex = store.bookmarks.findIndex((bookmark) => bookmark.id == bookmarkId);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${bookmarkId} not found`);
      return res.status(400).send('Bookmark not found');
    }

    store.bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id: ${bookmarkId} deleted.`);
    res.status(204).end();
  });

module.exports = bookmarkRouter;
