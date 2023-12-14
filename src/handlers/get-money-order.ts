import { Context, ScheduledEvent } from "aws-lambda";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

const { TOPIC_ARN } = process.env as {
  TOPIC_ARN: string;
};

export const snsClient = new SNSClient({});

const endpoint: string = "https://forex-api.coin.z.com/public/v1/ticker";

type Payload = {
  status: number;
  data: {
    ask: number;
    bid: number;
    symbol: string;
    timestamp: string;
    status: string;
  }[];
  responsetime: string;
};

export const handler = async (event: ScheduledEvent, context: Context) => {
  const payload: Payload = await fetch(endpoint).then((res) => res.json());

  if (payload.status != 0) {
    throw new Error("status is not 0");
  }
  for (const { ask, bid, timestamp, symbol, status } of payload.data) {
    if (status == "OPEN" && symbol == "USD_JPY" && ask < 140) {
      const message = `USD/JPY is ${ask}`;
      const response = await snsClient.send(
        new PublishCommand({ Message: message, TopicArn: TOPIC_ARN }),
      );
      console.log(message);
      break;
    }
  }

  return event;
};
