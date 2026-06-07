CC = gcc
CFLAGS = -std=c99 -O3 -Wall
INCLUDES = -Ikociemba_api/include
SRC_DIR = kociemba_api
BIN_DIR = bin

SOURCES = $(SRC_DIR)/coordcube.c \
          $(SRC_DIR)/cubiecube.c \
          $(SRC_DIR)/facecube.c \
          $(SRC_DIR)/search.c \
          $(SRC_DIR)/prunetable_helpers.c \
          $(SRC_DIR)/solve.c

TARGET = $(BIN_DIR)/kociemba_solver.exe

all: $(TARGET)

$(TARGET): $(SOURCES)
	@if not exist $(BIN_DIR) mkdir $(BIN_DIR)
	$(CC) $(CFLAGS) $(INCLUDES) $(SOURCES) -o $(TARGET)

clean:
	@if exist $(BIN_DIR) rmdir /s /q $(BIN_DIR)

.PHONY: all clean
