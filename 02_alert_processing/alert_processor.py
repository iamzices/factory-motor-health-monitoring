import logging
import os
from database import Alert, PostgresClient
from rabbitmq import RabbitMQClient


# --- configs ---
RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://rabbitmq:rabbitmq@localhost:5672/")
POSTGRES_URL = os.environ.get("POSTGRES_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
ALERTS_QUEUE = "alerts"
NOTIFICATIONS_EXCHANGE = "motor.notifications"
NOTIFICATIONS_ROUTING = "alertCreated."
ALERTS_TABLE = "motor_alerts"

# --- logger ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()


def main():
    postgres_client = PostgresClient(POSTGRES_URL, ALERTS_TABLE)
    rabbit_mq_client = RabbitMQClient(RABBITMQ_URL, ALERTS_QUEUE, NOTIFICATIONS_EXCHANGE, NOTIFICATIONS_ROUTING, logger)

    def handle(body):
        alert = Alert.model_validate(body)
        postgres_client.insert_alert(alert)
        rabbit_mq_client.publish(alert)

    rabbit_mq_client.consume(handler=handle)


if __name__ == "__main__":
    main()
