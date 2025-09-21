import amqplib from "amqplib";

/**
 * Client for handling RabbitMQ operations
 */
export default class RabbitMQClient {
  constructor(url, exchange) {
    this.url = url;
    this.exchange = exchange;
    this.connection = null;
    this.channel = null;
  }

  /**
   * Establishes connection to RabbitMQ and creates exchange
   */
  async connect() {
    try {
      this.connection = await amqplib.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, "topic", { durable: true });
      console.log("[RabbitMQ] Connected and exchange declared");
    } catch (error) {
      console.error("[RabbitMQ] Error connecting:", error);
      throw error;
    }
  }

  /**
   * Publishes message to this.exchange with the specified routing key
   */
  publish(routingKey, message, id) {
    if (!this.channel) throw new Error("Channel not initialized");
    try {
      this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { contentType: "application/json", persistent: true }
      );
      console.log(`[RabbitMQ] Published to ${routingKey} (id=${id}): ${JSON.stringify(message)}`);
      return true;
    } catch (err) {
      console.error(`[RabbitMQ] Error publishing (id=${id}):`, err);
      return false;
    }
  }
  /**
   * Closes RabbitMQ connection and channel
   */
  async close() {
    if (this.connection) {
      try {
        await this.channel?.close();
        await this.connection.close();
        this.channel = null;
        this.connection = null;
      } catch (error) {
        console.error("[RabbitMQ] Error closing connection:", error);
      }
    }
  }
}