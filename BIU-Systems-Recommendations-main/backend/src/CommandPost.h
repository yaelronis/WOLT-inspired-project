#pragma once

#include "./command_manager.h"
#include <deque>
#include <filesystem>
#include <optional>
#include <string>
#include <tuple>
#include <unordered_set>

using std::optional;
using std::string;
using std::tuple;
using std::deque;
using std::unordered_set;

class Post : public Command {
    private:
        std::filesystem::path data_file;

    public:
        Post(std::filesystem::path data_file);
        virtual string help();

        // takes: `{user_id} {product...}`
        // saves products for user in data file
        virtual HTTP::Response apply(deque<string> arguments);

        // parses string arguments into optional: {user_id, products}
        // where result is none if parsing fails
        static optional<tuple<string, unordered_set<string>>> parse_args(deque<string> arguments);
};
