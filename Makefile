NAME ?= pd-github-action
export PACKAGE_NAME ?= $(NAME)
ifeq ($(OS),Windows_NT)
	export VERSION=$(shell type VERSION)
else
	export VERSION=$(shell cat VERSION)
endif

COBERTURA = cobertura

GOX = gox

GOLANGCI_LINT = golangci-lint

GOSEC = gosec

SWAG = swag

START_SUPER_LINTER_CONTAINER = start_super_linter_container

.PHONY: help
help:
  # make version:
	# make test
	# make lint

.PHONY: version
version:
	@echo Version: $(VERSION)

.PHONY: test
test:
	@echo "Running tests..."
	@npm run test

.PHONY: lint
lint: $(START_SUPER_LINTER_CONTAINER)
	@echo "Running linter..."
	@docker cp $(PACKAGE_NAME)-linter:/tmp/lint/super-linter.log .
	@echo "Linter report saved to super-linter.log"
	@docker stop $(PACKAGE_NAME)-linter
	@echo "Linter finished."

.PHONY: build
build:
	@echo "Building..."
	@npm run bundle
	@echo "Build finished."

.PHONY: format
build:
	@echo "Formatting..."
	@npm run format:write
	@echo "Formating finished."

.PHONY: format_check
build:
	@echo "Check formatting..."
	@npm run format:check
	@echo "Check formating finished."


.PHONY: release-check
release-check: build test lint format_check

$(START_SUPER_LINTER_CONTAINER):
ifeq ($(OS), Windows_NT)
	$(eval CONTAINER_ID := $(shell  docker ps -a -q -f "name=$(PACKAGE_NAME)-linter"))
	$(eval REPO := $(shell git rev-parse --abbrev-ref HEAD))
	@IF "$(CONTAINER_ID)" EQU "" (\
	docker run --name $(PACKAGE_NAME)-linter -e DEFAULT_BRANCH=main -e RUN_LOCAL=true -e VALIDATE_ALL_CODEBASE=true -e VALIDATE_JSCPD=false -e CREATE_LOG_FILE=true -e VALIDATE_GO=false -v .:/tmp/lint ghcr.io/super-linter/super-linter:latest \
	) \
	ELSE (\
	docker start $(PACKAGE_NAME)-linter --attach \
	);
else
	$(eval CONTAINER_ID := $(shell docker ps -a | grep $(PACKAGE_NAME)-linter | awk '{print $$1}'))
	$(eval REPO := $(shell git rev-parse --abbrev-ref HEAD))
	@if [ -z $(CONTAINER_ID) ]; then \
	echo "Linter container does not exist, creating it..."; \
	docker run --platform linux/amd64 --name $(PACKAGE_NAME)-linter -e DEFAULT_BRANCH=$(REPO) -e RUN_LOCAL=true -e VALIDATE_ALL_CODEBASE=true -e VALIDATE_JSCPD=false -e CREATE_LOG_FILE=true -e VALIDATE_GO=false -v .:/tmp/lint ghcr.io/super-linter/super-linter:slim-latest; \
	else \
	echo "Linter container already exists $(CONTAINER_ID), starting it..."; \
	docker start $(PACKAGE_NAME)-linter --attach; \
	fi
endif