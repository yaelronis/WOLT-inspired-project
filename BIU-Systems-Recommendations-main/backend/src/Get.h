#pragma once
#include "command_manager.h"
#include <deque>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <vector>

// Class for the command "get" (was "recommend").
// Reads data from a file and produces recommendations.
// Inherits from Command so it can be used by CommandManager.
// As a Get request, apply() returns:
// -success                     200 Ok + body (recommended products)
// -user doesn't exist in data  404 Not Found
// -bad arguments               400 Bad Request

// Public helper methods (compute, get_recommendations) for direct unit testing
// without going through apply() or the file.
class Get : public Command {
public:
    // The constructor.
    // When main.cpp writes Get this is what runs.
    explicit Get(const std::string& dataFilePath);
    // Required by Command. Returns the help text for this command.
    std::string help() override;
    // Required by Command. CommandManager calls this when a "get" request
    // arrives. Re-reads the file and delegates to get_recommendations().
    HTTP::Response apply(std::deque<std::string> arguments) override;
    // Reads the file and returns its contents as a string.
    // Returns empty string if the file does not exist.
    std::string readSource() const;
    // The recommendation algorithm. Returns up to 10 product IDs.
    // Sorted by relevance, then by product id (lexicographic).
    // Public so tests can call it directly without going through a file.
    std::vector<std::string> compute(
        const std::string& userId,
        const std::string& productId,
        const std::unordered_map<std::string, std::unordered_set<std::string>>& data) const;

    // Takes the raw arguments plus the data file contents as a string,
    // and returns {status, body}:
    // - {BadRequest, ""}      if there are not exactly two arguments
    // - {NotFound, ""}        if the user is not in the data
    // - {Ok, body}            on success, body = recommended products joined by spaces
    std::tuple<HTTP::Status, std::string> get_recommendations(
        const std::deque<std::string>& arguments,
        const std::string& contents) const;

private:
    // The path to data. The file is reread on every apply() call,
    // so the command doesnt keep state between calls.
    std::string dataFilePath_;
};