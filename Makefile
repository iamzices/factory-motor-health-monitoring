.PHONY: infra install ingestion processor dashboard test

infra:
	@set -e; docker rm -f motor-rmq motor-pg >/dev/null 2>&1 || true; \
	docker run -d --name motor-rmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=rabbitmq -e RABBITMQ_DEFAULT_PASS=rabbitmq rabbitmq:3-management; \
	until curl -fs -u rabbitmq:rabbitmq http://localhost:15672/api/overview >/dev/null; do sleep 1; done; \
	curl -fs -u rabbitmq:rabbitmq -H "content-type: application/json" -X PUT http://localhost:15672/api/exchanges/%2F/motor.alerts -d '{"type":"topic","durable":true}' >/dev/null; \
	curl -fs -u rabbitmq:rabbitmq -H "content-type: application/json" -X PUT http://localhost:15672/api/exchanges/%2F/motor.notifications -d '{"type":"topic","durable":true}' >/dev/null; \
	curl -fs -u rabbitmq:rabbitmq -H "content-type: application/json" -X PUT http://localhost:15672/api/queues/%2F/alerts -d '{"durable":true}' >/dev/null; \
	curl -fs -u rabbitmq:rabbitmq -H "content-type: application/json" -X PUT http://localhost:15672/api/queues/%2F/notifications -d '{"durable":true}' >/dev/null; \
	curl -fs -u rabbitmq:rabbitmq -H "content-type: application/json" -X POST http://localhost:15672/api/bindings/%2F/e/motor.alerts/q/alerts -d '{"routing_key":"alert.*"}' >/dev/null; \
	curl -fs -u rabbitmq:rabbitmq -H "content-type: application/json" -X POST http://localhost:15672/api/bindings/%2F/e/motor.notifications/q/notifications -d '{"routing_key":"alertCreated.*"}' >/dev/null; \
	docker run -d --name motor-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres postgres:15; \
	until docker exec motor-pg pg_isready -h localhost -U postgres >/dev/null 2>&1; do sleep 1; done; \
	docker exec -i motor-pg psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < 03_sql_queries/create_table.sql

install:
	@cd 01_data_ingestion && npm ci
	@python -m pip install -r requirements.txt

ingestion:
	@cd 01_data_ingestion && node server.js

processor:
	@cd 02_alert_processing && python alert_processor.py

dashboard:
	@cd 04_frontend_prototype && python app.py

test:
	@python -m pytest tests
