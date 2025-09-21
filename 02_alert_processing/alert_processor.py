import json
import logging
from database import Alert, PostgresClient
from rabbitmq import RabbitMQClient


# --- configs ---
CONFIG_PATH = "config.json"
with open(CONFIG_PATH, "r", encoding="utf-8") as file:
    config = json.load(file)

RABBITMQ_URL = config["rabbitmq_url"]
ALERTS_QUEUE = config["alerts_queue"]
NOTIFICATIONS_EXCHANGE = config["notifications_exchange"]
NOTIFICATIONS_ROUTING = config["notifications_routing"]
POSTGRES_URL = config["postgres_url"]
ALERTS_TABLE = config["alerts_table"]

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
