
.PHONY: setup setup1 setup2 1 2 setup4 app4

setup:
	@set -e; docker rm -f rmq pg >/dev/null 2>&1 || true; \
	docker run -d --name rmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=rabbitmq -e RABBITMQ_DEFAULT_PASS=rabbitmq rabbitmq:3-management; \
	until curl -s -u rabbitmq:rabbitmq http://localhost:15672/api/overview >/dev/null; do sleep 1; done; \
	curl -s -u rabbitmq:rabbitmq -H "content-type: application/json" -X PUT http://localhost:15672/api/exchanges/%2F/motor.alerts -d '{"type":"topic","durable":true}' >/dev/null; \
	curl -s -u rabbitmq:rabbitmq -H "content-type: application/json" -X PUT http://localhost:15672/api/exchanges/%2F/motor.notifications -d '{"type":"topic","durable":true}' >/dev/null; \
	curl -s -u rabbitmq:rabbitmq -H "content-type: application/json" -X PUT http://localhost:15672/api/queues/%2F/alerts -d '{"durable":true}' >/dev/null; \
	curl -s -u rabbitmq:rabbitmq -H "content-type: application/json" -X PUT http://localhost:15672/api/queues/%2F/notifications -d '{"durable":true}' >/dev/null; \
	curl -s -u rabbitmq:rabbitmq -H "content-type: application/json" -X POST http://localhost:15672/api/bindings/%2F/e/motor.alerts/q/alerts -d '{"routing_key":"alert.*"}' >/dev/null; \
	curl -s -u rabbitmq:rabbitmq -H "content-type: application/json" -X POST http://localhost:15672/api/bindings/%2F/e/motor.notifications/q/notifications -d '{"routing_key":"alertCreated.*"}' >/dev/null; \
	
	docker run -d --name pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres postgres:15; \
	until docker exec pg pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done; \
	docker exec -i pg psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < 03-sql_queries/create_table.sql

setup1:
	@cd 01_data_ingestion && npm install

setup2:
	@python -m pip install --upgrade pip && python -m pip install kombu pydantic sqlalchemy psycopg2-binary

setup4:
	@python -m pip install --upgrade pip && python -m pip install fastapi uvicorn sqlalchemy psycopg2-binary asyncpg

1:
	@cd 01_data_ingestion && node server.js

2:
	@cd 02_alert_processing && py alert_processor.py

app4: 
	@cd 04_frontend_prototype && python application.py
