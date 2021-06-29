/* jshint esversion: 8 */
const express = require('express');
const bodyParser = require('body-parser');
const debug = require('debug')('app');
const chalk = require('chalk');
// const model = require('./models/TraineeModel');
const app = express();
const apikey = "5f61b0ad1e1b0a247729d875";
const PORT = process.env.PORT || 5000;

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const authRouter = require('./src/routes/authRoutes');
const {
  query
} = require('express');
const url = 'mongodb+srv://dbAPIUser:aAzzhulCjjjw1a6R@cluster0.xtvoz.mongodb.net/EDQINFO?retryWrites=true&w=majority';



const dbName = 'EDQINFO';

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use('/auth', authRouter);

// create application/json parser
const jsonParser = bodyParser.json();

const findAndUpdateDocument = function (db, doc, col, callback) {
  // Get the documents collection
  const collection = db.collection(col);
  // Update document where a is 2, set b equal to 1
  collection.findOneAndReplace({
    email: doc.email
  }, doc, {
    upsert: true
  }, function (err, result) {
    assert.equal(err, null);
    // assert.equal(1, result.result.n);
    debug("findAndUpdated the document with the email a equal to email");
    callback(result);
  });
};


const insertDocument = function (db, doc, col, callback) {
  // Get the documents collection
  (async function mongo() {
    debug(`document for insert: ${JSON.stringify(doc)}`);
    const collection = db.collection(col);
    // Insert some documents
    debug('Inserting Documents');
    await collection.insertOne(doc, function (err, result) {
      assert.equal(err, null);
      assert.equal(1, result.result.n);
      assert.equal(1, result.ops.length);
      debug("Inserted 1 documents into the collection");
      // debug(result);
      callback(result);
    });
  }());
};
const findDocuments = function(db, doc, questionnaire_id, callback) {
  // Get the documents collection
  const collection = db.collection(doc);
  // Find some documents
  collection
    .find({ questionnaire_id:questionnaire_id })
    .toArray(function (err, docs) {
      assert.equal(err, null);
      debug("Found the following records");
      // debug(docs);
      callback(docs);
    });
};
const findAllDocuments = function (db, doc, callback) {
  // Get the documents collection
  const collection = db.collection(doc);
  // Find some documents
  collection.find({}).toArray(function (err, docs) {
    assert.equal(err, null);
    debug("Found the following records");
    // debug(docs);
    callback(docs);
  });
};
const findAllQuestionAnswersSort = function (db, doc, callback) {
  // Get the documents collection
  const collection = db.collection(doc);
  // Find some documents
  collection.find().sort({timestamp: -1}).toArray(function (err, docs) {
    assert.equal(err, null);
    debug("Found the following records");
    // debug(docs);
    callback(docs);
  });
};
const getSum = function (total, num) {
  return total + Math.round(num);
};
const findDocument = function (db, query, doc, callback) {
  // Get the documents collection
  (async function mongo() {
    const collection = db.collection(doc);
    // Find some documents
    //    console.log(`email!!!!: ${email.toLowerCase()}`);
    await collection.find(query).collation({ // case insensitive
      locale: 'en',
      strength: 2
    }).toArray(function (err, docs) {
      debug("found findDocument records");
      callback(docs);
    });
  }());
};

app.get('/', (req, resp) => {
  console.log('Welcome to my API!!!');
  resp.send('Welcome to my API!!!');
});
app.post('/apiValueBenefit/AddUser/', (req, res) => {
  // Use connect method to connect to the server
  // console.log(`req: ${req}`);
  (async function mongo() {
    await MongoClient.connect(url, function (err, client) {
      assert.equal(null, err);
      debug("Connected successfully to server");
      let valid = false;
      let message;
      const db = client.db(dbName);
      const doc = {
        email: req.body.email,
        hash: req.body.hash,
        timestamp: new Date().getTime(),
      };
      // debug(chalk.red(`email: ${JSON.stringify(email.body)}`));
      insertDocument(db, doc, 'Users', function (results) {
        // if (req.body.apikey === 'undefined') {
        //   message = 'Missing API Key';
        //   valid = true;
        // }
        client.close();
        return res.json({
          message,
          body: results,
          // valid,
          // user: req.body
        });

      });
    });
  }());
});

app.get('/apiValueBenefit/getUser/:email', (req, res) => {
  // Use connect method to connect to the server
  // console.log(`req: ${req}`);
  MongoClient.connect(url, function (err, client) {
    assert.equal(null, err);
    debug("Connected successfully to server");
    const query = {
      email: req.params.email
    };
    const db = client.db(dbName);
    // debug(chalk.red(`email: ${JSON.stringify(email.body)}`));
    findDocument(db, query, 'Users', function (results) {
      client.close();
      return res.json({
        message: `Handling GET request to /apiValueBenefit/getUser:email/`,
        body: results
      });

    });

  });
});
app.get('/apiValueBenefit/getRole/:email', (req, res) => {
  // Use connect method to connect to the server
  // console.log(`req: ${req}`);
  MongoClient.connect(url, function (err, client) {

    assert.equal(null, err);
    debug("Connected successfully to server");
    const query = {
      email: req.params.email
    };
    const db = client.db(dbName);
    // debug(chalk.red(`email: ${JSON.stringify(email.body)}`));
    findDocument(db, query, 'Roles', function (results) {
      client.close();
      return res.json({
        message: `Handling GET request to /apiValueBenefit/getRole/`,
        body: results
      });

    });

  });
});
app.get('/apiValueBenefit/getUsers', (req, res) => {
  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, client) {

    assert.equal(null, err);
    debug("Connected successfully to server");

    const db = client.db(dbName);

    findAllDocuments(db, 'Users', function (results) {
      client.close();
      return res.json({
        message: `Handling GET request to /apiValueBenefit/getUsers/`,
        body: results
      });

    });

  });
});

app.post('/apiValueBenefit/postQuestionnaire/', (req, res) => {
  // Database Name

  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, client) {

    assert.equal(null, err);
    debug("Connected successfully to server");

    const db = client.db(dbName);
    debug('About to perform insert');
    if (req.body.timestamp === '') {
      req.body.timestamp =  new Date().getTime();
          insertDocument(db, req.body, 'QuestionnaireAnswers', function (results) {
            client.close();
            return res.json({
              message: `Handling POST request to /apiValueBenefit/postQuestionnaire/`,
              body: results
            });

          });
    } else {
            // failed verification
            return res.json({
              status: 400,
            });
    }


  });
});
app.post("/apiValueBenefit/postAssessment/", (req, res) => {
  // Database Name

  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, client) {
    assert.equal(null, err);
    debug("Connected successfully to server");

    const db = client.db(dbName);
    debug("About to perform insert");
    if (req.body.timestamp === "") {
      req.body.timestamp = new Date().getTime();
      //const reducer = (accumulator, currentValue) => accumulator + currentValue;
      req.body.total = req.body.answer.reduce(getSum,0);
      insertDocument(db, req.body, "AssessmentAnswers", function (results) {
        client.close();
        return res.json({
          message: `Handling POST request to /apiValueBenefit/AssessmentAnswers/`,
          body: results,
        });
      });
    } else {
      // failed verification
      return res.json({
        status: 400,
      });
    }
  });
});
app.get('/apiValueBenefit/getQuestionnaire/', jsonParser, (req, res) => {
  // Database Name

  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, client) {

    assert.equal(null, err);
    debug("Connected successfully to server");

    const db = client.db(dbName);

    findAllDocuments(db, 'Questionnaire', function (results) {
      client.close();
      return res.json({
        message: `Handling GET request to /apiValueBenefit/getQuestionnaire!/`,
        body: results
      });

    });

  });
});
app.get("/apiValueBenefit/getAssessment/", jsonParser, (req, res) => {
  // Database Name

  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, client) {
    assert.equal(null, err);
    debug("Connected successfully to server");

    const db = client.db(dbName);

    findAllDocuments(db, "Assessment", function (results) {
      client.close();
      return res.json({
        message: `Handling GET request to /apiValueBenefit/getAssessment!/`,
        body: results,
      });
    });
  });
});
app.get('/apiValueBenefit/getQuestionnaireById/', jsonParser, (req, res) => {
  // Database Name

  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, client) {
    assert.equal(null, err);
    debug("Connected successfully to server");

    const db = client.db(dbName);

    findDocuments(
      db,
      "Questionnaire",
      "6089b8302276bec8cefc7b29",
      function (results) {
        client.close();
        return res.json({
          message: `Handling GET request to /apiValueBenefit/getQuestionnaireById/`,
          body: results,
        });
      }
    );
  });
});
app.get('/apiValueBenefit/getQuestionnaireAnswers/', jsonParser, (req, res) => {
  // Database Name

  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, client) {

    assert.equal(null, err);
    debug("Connected successfully to server");

    const db = client.db(dbName);

    findAllQuestionAnswersSort(db, 'QuestionnaireAnswers', function (results) {
      client.close();
      return res.json({
        message: `Handling GET request to /apiValueBenefit/getQuestionnaireAnswers/`,
        body: results
      });

    });

  });
});

app.get('/apiValueBenefit/getEvents/', jsonParser, (req, res) => {
  // Database Name

  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, client) {

    assert.equal(null, err);
    debug("Connected successfully to server");

    const db = client.db(dbName);

    findAllDocuments(db, 'Events', function (results) {
      client.close();
      return res.json({
        message: `Handling GET request to /apiValueBenefit/getEvents/`,
        body: results
      });

    });

  });
});

app.post('/apiValueBenefit/post', (req, res) => {

  const dbName = 'EDQINFO';
  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, client) {

    assert.equal(null, err);
    debug("Connected successfully to server");

    const db = client.db(dbName);

    findAndUpdateDocument(db, req.body, 'Users', function (results) {
      debug(`results from findOneAndReplace call: ${JSON.stringify(results)}`);
      assert.equal(err, null);
      // assert.equal(1, results.result.n);
      debug('Finished asserts');
      client.close();

      return res.json({
        message: 'Handling PUT request to /Trainees',
        body: results
      });
    });
    //TODO write method to skip insert if documnent was updated or run if not updated
    // insertDocument(db, req.body, 'trainee', function (results) {
    //   client.close();
    //   return res.json({
    //     message: 'Handling GET request to /Trainees',
    //     body: results
    //   });

    // });

  });
});

app.post('/auth', (req, resp) => {
  console.log('You Posted to my auth API!!!');
  resp.send('You Posted to my auth API!!!');
});
/* app.get('/TrainingApi/Trainees', (req, res ) =>{
  res.send('Request Received!!');
}); */

app.listen(PORT, () => {
  debug(`listening on ${chalk.green(PORT)}`);
});