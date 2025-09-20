import amqplib from "amqplib";

export default class RabbitMQClient {

    constructor(url, exchange) {
        this.url = url;
        this.exchange = exchange;
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        try {
            this.connection = await amqplib.connect(this.url);
            this.channel = await this.connection.createChannel();
            await this.channel.assertExchange(this.exchange, "topic", { durable: true });
            console.log("Connected to [RabbitMQ] and exchange declared");
        } catch (error) {
            console.error("Error connecting to [RabbitMQ]: ", error);
            process.exit(1)
        }
    }

    publish(routingKey, message) {
        try {
            if (!this.channel) {
                throw new Error("Channel not initialized")
            }
            this.channel.publish(
                this.exchange,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                {
                    contentType: "application/json",
                    persistent: true
                }
            );
            console.log("Published [RabbitMQ] message (${routingKey})", message)
        } catch (error) {
            console.error("Error publishing message to [RabbitMQ]: ", error);
        }
    } 

    async close() {
        await this.channel?.close();
        await this.connection?.close();
        console.log("Closed connection to [RabbitMQ]")
    }
}