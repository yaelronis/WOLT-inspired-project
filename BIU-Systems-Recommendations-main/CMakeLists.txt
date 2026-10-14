cmake_minimum_required(VERSION 3.10)

project(BIU_Systems_Recommendations)

set(CMAKE_CXX_STANDARD 26)

# force re-build dependencies from FetchContent
cmake_policy(SET CMP0135 NEW)

# library: gtest
include(FetchContent)
FetchContent_Declare(
    googletest
    URL https://github.com/google/googletest/archive/refs/tags/v1.17.0.zip
)

## gtest - windows: prevents parent project from overriding compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# dependencies
## file dependencies
add_executable(
    main
    backend/src/main.cpp

    backend/src/command_manager.h
    backend/src/command_manager.cpp
    backend/src/CommandPost.h
    backend/src/CommandPost.cpp


    backend/src/CommandPatch.h
    backend/src/CommandPatch.cpp
    backend/src/CommandHelp.h
    backend/src/CommandHelp.cpp
    backend/src/Get.h
    backend/src/Get.cpp

    backend/src/utils.h
    backend/src/utils.cpp
    backend/src/tcp.h
    backend/src/tcp.cpp

    backend/src/Delete.cpp
    backend/src/Delete.h

)
add_executable(
    test
    backend/test/main.cpp

    backend/test/utils.cpp
    backend/src/utils.h
    backend/src/utils.cpp

    # no test file
    backend/src/tcp.h
    backend/src/tcp.cpp

    backend/test/command_manager.cpp
    backend/src/command_manager.h
    backend/src/command_manager.cpp

    backend/test/Delete.cpp
    backend/src/Delete.h
    backend/src/Delete.cpp

    
    backend/test/CommandPost.cpp
    backend/src/CommandPost.h
    backend/src/CommandPost.cpp

    backend/test/CommandPatch.cpp
    backend/src/CommandPatch.h
    backend/src/CommandPatch.cpp
    backend/test/Get.cpp
    backend/src/Get.h
    backend/src/Get.cpp
)
# library dependencies
target_link_libraries(
    test
    gtest_main
)


# compilation options
## more warnings
add_compile_options(-Wall -Wextra -Wpedantic)
## refuse to compile if warnings are emitted
add_compile_options(-Werror)
## debug symbols, no optimizations
add_compile_options(-g -O0)
