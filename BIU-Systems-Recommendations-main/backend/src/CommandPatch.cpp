#include "./CommandPatch.h"

#include "./utils.h"
#include <fstream>
#include <sstream>
#include <string>

Patch::Patch(std::filesystem::path data_file) : data_file(data_file) {}

std::string Patch::help() { return "[userid] [productid1] [productid2] …"; }

HTTP::Response Patch::apply(std::deque<string> arguments) {
    auto maybe_args = parse_args(arguments);
    if (!maybe_args) {
        return {HTTP::Status::BadRequest, ""};
    }
    auto [user, products] = maybe_args.value();
    // read entire data file, if file can't be opened: default to empty
    std::string data_file_content;
    {
        std::ostringstream data_stream;
        std::ifstream data_file{this->data_file};
        if (data_file.is_open()) {
            data_stream << data_file.rdbuf();
            data_file_content = data_stream.str();
        }
    }
    auto data = parse_data_file_contents(data_file_content);
    if (!data.contains(user)) {
        return {HTTP::Status::NotFound, ""};
    }
    // update data, write back
    for (std::string product : products) {
        data[user].insert(product);
    }
    std::string data_file_content_updated = format_data_file_contents(data);
    std::ofstream data_file{this->data_file, std::ios::trunc};
    if (!data_file.is_open()) {
        return {HTTP::Status::InternalServerError, ""};
    }
    data_file << data_file_content_updated;
    return {HTTP::Status::NoContent, ""};
}

optional<tuple<string, unordered_set<string>>> Patch::parse_args(std::deque<string> arguments) {
    // must contain user
    if (arguments.empty()) {
        return {};
    }
    string user = arguments.front();
    arguments.pop_front();
    // rest is products, must have at least one
    if (arguments.empty()) {
        return {};
    }
    unordered_set<string> products{arguments.begin(), arguments.end()};
    return {{user, products}};
}
