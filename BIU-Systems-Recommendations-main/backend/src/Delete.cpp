#include "../src/Delete.h"

#include "./utils.h"
#include <fstream>
#include <sstream>
#include <string>

Delete::Delete(std::filesystem::path data_file) : data_file(data_file) {}

std::string Delete::help() { return "[userid] [productid1] [productid2] …"; }

HTTP::Response Delete::apply(std::deque<string> arguments) {
    // 400 Bad Request- invalid arguments (no userid or no productids).
    auto maybe_args = parse_args(arguments);
    if (!maybe_args) {
        return {HTTP::Status::BadRequest, ""};
    }
    auto [user, products] = maybe_args.value();
    // Read entire data file and if file can't be opened then default to empty.
    // A missing or unreadable file means there are no users at all which
    // means the requested user doesn't exist in the data = 404 Not Found.
    std::string data_file_content;
    {
        std::ostringstream data_stream;
        std::ifstream data_file{this->data_file};
        if (data_file.is_open()) {
            data_stream << data_file.rdbuf();
            data_file_content = data_stream.str();
        }
    }
    // Delegate the actual work to the pure function.
    auto [status, data_file_content_updated] =
        delete_products(data_file_content, user, products);
    // 404 Not Found- user wasn't in the data so there is nothing to write.
    if (status == HTTP::Status::NotFound) {
        return {HTTP::Status::NotFound, ""};
    }
    // Write back the updated contents.
    std::ofstream data_file{this->data_file, std::ios::trunc};
    if (!data_file.is_open()) {
        // 500 Internal Server Error- user existed but we cant write.
        return {HTTP::Status::InternalServerError, ""};
    }
    data_file << data_file_content_updated;
    // 204 No Content- a success.
    return {HTTP::Status::NoContent, ""};
}

tuple<HTTP::Status, string> Delete::delete_products(
    const string& contents,
    const string& user,
    const unordered_set<string>& products)
{
    auto data = parse_data_file_contents(contents);
    // 404 Not Found- user doesn't exist in data.
    if (!data.contains(user)) {
        return {HTTP::Status::NotFound, ""};
    }
    // Remove each listed product from the user's set. erase() on a missing
    // key is a not optional, which is fine- deleting a product the user never had
    // is still a success.
    for (std::string product : products) {
        data[user].erase(product);
    }
    // Rearrangement. format_data_file_contents drops empty user entries so if
    // we deleted the user's last product their line disappears from the file.
    return {HTTP::Status::NoContent, format_data_file_contents(data)};
}

optional<tuple<string, unordered_set<string>>> Delete::parse_args(std::deque<string> arguments) {
    // Must contain user.
    if (arguments.empty()) {
        return {};
    }
    string user = arguments.front();
    arguments.pop_front();
    // Rest is products and must have at least one.
    if (arguments.empty()) {
        return {};
    }
    unordered_set<string> products{arguments.begin(), arguments.end()};
    return {{user, products}};
}