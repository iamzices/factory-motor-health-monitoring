import json
import logging
import uuid
from kombu import Connection, Consumer, Exchange, Producer, Queue


class RabbitMQClient:
    """Client for handling RabbitMQ operations"""
    def __init__(
        self, 
        rabbitmq_url: str, 
        alerts_queue: str, 
        notifications_exchange: str, 
        notifications_routing: str,
        logger: logging.Logger,
    ):
        self.url = rabbitmq_url
        self.alerts_queue = Queue(alerts_queue)
        self.notifications_exchange = Exchange(notifications_exchange, type="topic", durable=True)
        self.notifications_routing = notifications_routing
        self.conn = Connection(self.url)
        self.producer = Producer(self.conn)
        self.handler = None
        self.logger = logger

    def publish(self, alert):
        if not self.producer:
            raise RuntimeError("[RabbitMQ] Client not connected")
        routing_key = f"{self.notifications_routing}{alert.sensor_type}"
        self.producer.publish(
            alert.model_dump(),
            exchange=self.notifications_exchange,
            routing_key=routing_key,
            serializer="json",
            delivery_mode=2 # persistent
        )

    def consume(self, handler):
        if not self.conn:
            raise RuntimeError("[RabbitMQ] Client not connected")
        self.handler = handler
        with Consumer(
            self.conn,
            queues=[self.alerts_queue],
            callbacks=[self._on_message],
            accept=["application/json"],
        ):
            self.logger.info(f"[RabbitMQ] Consumer attached to queue ({self.alerts_queue.name})")
            while True:
                self.conn.drain_events()

    def _on_message(self, body, message):
        """internal callback used by Consumer to process incoming messages"""
        id = str(uuid.uuid4()) # generate unique ID for tracking in logs
        try:
            self.logger.info(f"[RabbitMQ] Received message (id={id}): {json.dumps(body)}")
            self.handler(body) 
            message.ack() 
            self.logger.info(f"[RabbitMQ] Processed message (id={id})")
        except Exception as e:
            self.logger.error(f"[RabbitMQ] Error processing message (id={id}): {e}")
            message.reject() 