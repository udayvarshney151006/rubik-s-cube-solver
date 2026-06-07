cmake_minimum_required(VERSION 3.10)
project(KociembaSolver C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Optimization flags
if(MSVC)
    add_compile_options(/O2)
else()
    add_compile_options(-O3 -Wall)
endif()

# Source files
set(SOLVER_SOURCES
    kociemba_api/coordcube.c
    kociemba_api/cubiecube.c
    kociemba_api/facecube.c
    kociemba_api/search.c
    kociemba_api/prunetable_helpers.c
    kociemba_api/solve.c
)

# Include directories
include_directories(kociemba_api/include)

# Executable target
add_executable(kociemba_solver ${SOLVER_SOURCES})

# Output binary to backend/bin directory
set_target_properties(kociemba_solver PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin"
)
