require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const urlExists = require("url-exists");
const app = express();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var URLSchema = new mongoose.Schema
(
  {
    original_url: String,
    short_url: Number
  }
)

var URLModel = mongoose.model("URLModel", URLSchema);

app.post('/api/shorturl', async function(req, res) 
{
  urlExists(req.body.url, async function(err, exists) 
  {
    if (!exists)
    {
      res.json({ "error": 'invalid url' });
    }
    else
    {
      var previousURL = await URLModel.find().sort({ short_url: -1 }).limit(1).exec();
      var objectOriginalURL = { "original_url": req.body.url, "short_url": 1 }
      
      if (previousURL.length > 0)
      {
        objectOriginalURL.short_url += previousURL[0].short_url;
      }

      var originalURL = new URLModel(objectOriginalURL);
      originalURL.save();
      res.json(objectOriginalURL);
    }
  });
});

app.get('/api/shorturl/:shorturl', async function(req, res) 
{
  var redirectURL = await URLModel.findOne({ "short_url": req.params.shorturl });

  if (redirectURL)
  {
    res.redirect(301, redirectURL.original_url);
  }
  else
  {
    res.json({ error: "no records of short_url '" + req.params.shorturl + "' were found" });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
