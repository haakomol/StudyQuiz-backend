# StudyQuiz-backend
Serverless backend for my Angular StudyQuiz application.

Uses AWS services API Gateway (for setting up HTTP endpoints), Lambda (for running code when frontend hits those endpoints) and DynamoDB (for persistent data storage). Uses the [Serverless framework](https://serverless.com/) for streamlined deployment.

After installing Serverless framework and setting up AWS credentials, the Lambda functions and API gateway is set up by running `serverless deploy` in the folder. Serverless deploys to AWS by using the CloudFormation service to make a CloudFormation stack. The stack (everything that was deployed) can easily be removed again with `serverless remove`. [Docs for Serverless commands](https://serverless.com/framework/docs/providers/aws/cli-reference/).

DynamoDB tables and necesarry IAM roles for the Lambda functions must be set up separately.
