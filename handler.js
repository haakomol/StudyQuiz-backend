'use strict';
var AWS = require("aws-sdk");
var quizzesTable = "studyquiz-quizzes";
var countersTable = "studyquiz-counters"

module.exports.getQuiz = (event, context, callback) => {

  var response = {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
    }
  }
  var docClient = new AWS.DynamoDB.DocumentClient();

  let id = parseInt(event.pathParameters.id);
  if (isNaN(id)) {
    response['statusCode'] = 400;
    response['body'] = "Error: id is not a number";
    callback(null, response);
  }

  var params = {
    TableName: quizzesTable,
    Key: {
      "id": id,
    }
  };
  
  docClient.get(params, function (err, data) {
    
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      response['statusCode'] = 404;
      response['body'] = JSON.stringify(err);
    } else {
      console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
      response['statusCode'] = 200;
      response['body'] = JSON.stringify(data);
    }

    callback(null, response);
  });

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

module.exports.getQuizzesList = (event, context, callback) => {

  var response = {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
    }
  }
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: quizzesTable,
    ProjectionExpression: "id, #name",
    ExpressionAttributeNames: {
      "#name": "name",
    },
  };

  docClient.scan(params, function (err, data) {

    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      response['statusCode'] = 404;
      response['body'] = JSON.stringify(err);
    } else {
      console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
      response['statusCode'] = 200;
      response['body'] = JSON.stringify(data);
    }

    callback(null, response);
  });
};

module.exports.putQuiz = (event, context, callback) => {

  var docClient = new AWS.DynamoDB.DocumentClient();

  // Increment quiz-counter in countersTable and use it as id for new quiz item in quizzesTable

  var params = {
    TableName: countersTable,
    Key: {
      "counter": "quiz-counter",
    },
    UpdateExpression: 'set #value = #value + :increment',
    ExpressionAttributeNames: {
      "#value": "value",
    },
    ExpressionAttributeValues: {
      ':increment': 1,
    },
    ReturnValues: "UPDATED_NEW"
  };

  docClient.update(params, function (err, data) {

    if (err) {
      console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

      const uniqueQuizId = data['Attributes']['value'];
      const quizData = JSON.parse(event.body);

      putQuizWithId(uniqueQuizId, quizData, callback);
    }
  });
};

function putQuizWithId(id, quizData, callback) {

  var response = {
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
    }
  }
  var docClient = new AWS.DynamoDB.DocumentClient();

  var badData = false;
  var quiz = {};

  quiz.id = id;
  if (typeof quizData.name === 'string') { quiz.name = quizData.name; } else { badData = true; }
  if (typeof quizData.description === 'string') { quiz.description = quizData.description; } else { badData = true; }

  quiz.exercises = [];
  if (quizData.exercises.length < 1) { badData = true; }
  quizData.exercises.forEach(exerciseData => {
    var exercise = {};
    if (typeof exerciseData.question === 'string') { exercise.question = exerciseData.question; } else { badData = true; }
    if (typeof exerciseData.correctAnswer === 'string') { exercise.correctAnswer = exerciseData.correctAnswer; } else { badData = true; }
    if (exerciseData.explanation) {
      if (typeof exerciseData.explanation === 'string') { exercise.explanation = exerciseData.explanation; } else { badData = true; }
    }

    exercise.incorrectAnswers = [];
    if (exerciseData.incorrectAnswers.length < 1) { badData = true; }
    exerciseData.incorrectAnswers.forEach(incorrectAnswerData => {
      if (typeof incorrectAnswerData === 'string') { exercise.incorrectAnswers.push(incorrectAnswerData) } else { badData = true; }
    });

    quiz.exercises.push(exercise);
  });

  if (badData) {
    response['statusCode'] = 400;
    response['body'] = "Invalid data given";
    callback(null, response);
    return;
  }

  var params = {
    TableName: quizzesTable,
    Item: quiz,
  };

  docClient.put(params, function (err, data) {

    if (err) {
      console.error("Unable to put item. Error JSON:", JSON.stringify(err, null, 2));
      response['statusCode'] = 404;
      response['body'] = JSON.stringify(err);
    } else {
      console.log("put succeeded:", JSON.stringify(data, null, 2));
      response['statusCode'] = 200;
    }

    callback(null, response);
  });
}
