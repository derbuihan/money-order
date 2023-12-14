import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { config } from "dotenv";

config();

const { EMAIL_ADDRESS } = process.env as {
  EMAIL_ADDRESS: string;
};

export class MoneyOrderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const topic = new Topic(this, "GetMoneyOrderTopic", {
      topicName: "GetMoneyOrderTopic",
    });
    topic.addSubscription(new EmailSubscription(EMAIL_ADDRESS));

    const lambda = new NodejsFunction(this, "GetMoneyOrder", {
      entry: "src/handlers/get-money-order.ts",
      runtime: Runtime.NODEJS_LATEST,
      handler: "handler",
      environment: {
        TOPIC_ARN: topic.topicArn,
      },
    });
    topic.grantPublish(lambda);

    new Rule(this, "GetMoneyOrderRule", {
      schedule: Schedule.expression("cron(*/5 * * * ? *)"),
      targets: [new LambdaFunction(lambda, { retryAttempts: 3 })],
    });
  }
}
