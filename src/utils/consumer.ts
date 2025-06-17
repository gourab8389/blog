import amqp from "amqplib";
import { redisClient } from "../server.js";
import { sql } from "./db.js";

interface CahcheInvalidationMessage {
  action: string;
  keys: string[];
}

export const StartCacheConsumer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: "localhost",
      port: 5672,
      username: "admin",
      password: "admin123",
    });
    const channel = await connection.createChannel();
    const queueName = "cache-invalidation";

    await channel.assertQueue(queueName, {
      durable: true,
    });

    console.log("Blog service consumer started", queueName);

    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(
            msg.content.toString()
          ) as CahcheInvalidationMessage;
          console.log("Received message:", content);

          if (content.action === "invalidateCache") {
            for (const pattern of content.keys) {
              const keys = await redisClient.keys(pattern);
              if (keys.length > 0) {
                await redisClient.del(keys);

                console.log(
                  `Blog service invalidated ${keys.length} cache keys matching pattern: ${pattern}`
                );

                const searchQuery = "";
                const category = "";
                const cachekey = `blogs:${searchQuery}:${category}`;

                const blogs = await sql`
                        SELECT * FROM blogs ORDER BY created_at DESC
                `;

                await redisClient.set(cachekey, JSON.stringify(blogs), {
                  EX: 60 * 60,
                  NX: true,
                });

                console.log("Blogs cache updated after invalidation");
              }
            }
          }

          channel.ack(msg);
        } catch (error) {
          console.error("Error parsing message content:", error);

          channel.nack(msg, false, true); // Reject the message without requeueing
        }
      }
    });
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
  }
};
