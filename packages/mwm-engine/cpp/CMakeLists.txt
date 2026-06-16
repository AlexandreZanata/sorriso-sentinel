cmake_minimum_required(VERSION 3.22.1)
project(mwm_engine_core LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(
  mwm_engine_core
  STATIC
  mwm_engine_core.cpp
)

target_include_directories(
  mwm_engine_core
  PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}
)
