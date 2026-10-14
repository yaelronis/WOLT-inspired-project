#pragma once

#include "./command_manager.h"
#include <deque>
#include <filesystem>
#include <optional>
#include <string>
#include <tuple>
#include <unordered_set>

using std::deque;
using std::optional;
using std::string;
using std::tuple;
using std::unordered_set;

// Command format: delete [userid] [productid1] [productid2]...
// Removes the listed products from the user's viewed items in the data file.
// Returns:
// - success                       204 No Content
// - user doesn't exist in data    404 Not Found
// - bad arguments                 400 Bad Request
// - file I/O failure              500 Internal Server Error
// function delete_products()- takes the file contents as a string and returns the result as a string, so it can be unit
// tested without any file I/O. 
// apply() just reads, calls it, and writes back.

class Delete : public Command {
    private:
        std::filesystem::path data_file;

    public:
        Delete(std::filesystem::path data_file);
        virtual string help();
        // Takes: {user_id} {product...} and removes the listed products from the user's set in the data file.
        virtual HTTP::Response apply(deque<string> arguments);
        // Parses string arguments into optional: {user_id, products}
        // a valid command has at least a userid and one productid.
        static optional<tuple<string, unordered_set<string>>> parse_args(deque<string> arguments);
        // Takes the data file contents as a string plus the parsed user and
        // products, and returns {status, updated_contents}:
        // - {NotFound, ""}                 if the user is not in the data
        // - {NoContent, updated_contents}  on success
        static tuple<HTTP::Status, string> delete_products(
            const string& contents,
            const string& user,
            const unordered_set<string>& products);
};