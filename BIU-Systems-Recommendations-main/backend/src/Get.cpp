#include "Get.h"

#include "./utils.h"
#include <algorithm>
#include <fstream>
#include <iostream>
#include <sstream>

// Constructor- store the file path. Data is re read on every apply().
Get::Get(const std::string& dataFilePath)
    : dataFilePath_(dataFilePath) {}

// Required by the Command interface- Returns the help text.
std::string Get::help() {
    return "[userid] [productid]";
}

// Called by CommandManager when a "get" request arrives.
// Re-reads the file and delegates the work to the pure get_recommendations().
HTTP::Response Get::apply(std::deque<std::string> arguments) {
    auto content = readSource();
    auto [status, body] = get_recommendations(arguments, content);
    return {status, body};
}

// Returns the data file as a string. Empty if the file does not exist.
std::string Get::readSource() const {
    std::ifstream f(dataFilePath_);
    // If the file doesn't exist yet then return an empty string
    if (!f.is_open()) return "";
    // Read the whole file into a string.
    std::stringstream buffer;
    buffer << f.rdbuf();
    return buffer.str();
}

// The testable core.
std::tuple<HTTP::Status, std::string> Get::get_recommendations(
    const std::deque<std::string>& arguments,
    const std::string& contents) const
{
    // 400 Bad Request- a valid get request has exactly two arguments (a userid and a productid).
    if (arguments.size() != 2) {
        return {HTTP::Status::BadRequest, ""};
    }
    std::string userId = arguments[0];
    std::string productId = arguments[1];

    // Parse the data.
    auto data = parse_data_file_contents(contents);

    // 404 Not Found- the requested user has no record in the data.
    // (The compute() algorithm can still handle unknown users, but the
    // pdf requires that a get for an unknown user reports Not Found.)
    if (!data.contains(userId)) {
        return {HTTP::Status::NotFound, ""};
    }

    // Run the recommendation algorithm.
    auto recs = compute(userId, productId, data);

    // 200 -success. Build the response body as the product ids separated by
    // single spaces. If there are no recommendations then the body is empty
    // which is still a success.
    std::ostringstream body;
    for (size_t i = 0; i < recs.size(); ++i) {
        if (i > 0) body << ' ';
        body << recs[i];
    }
    return {HTTP::Status::Ok, body.str()};
}

// Calculates recommendations.
// Handles both known and unknown users using the same unified logic.
std::vector<std::string> Get::compute(
    const std::string& userId,
    const std::string& productId,
    const std::unordered_map<std::string, std::unordered_set<std::string>>& data) const
{
    auto targetIt = data.find(userId);

    // If the user is unknown (not found in the data), we pretend they exist
    // but only have this one target product in their history.
    // If they are known, we just use their normal history.
    auto targetProducts = (targetIt == data.end())
        ? std::unordered_set<std::string>({productId})
        : targetIt->second;
    targetProducts.insert(productId);
    // Calculate similarity (number of common products) with every
    // user who watched the target product. Skip the target user themselves.
    std::unordered_map<std::string, int> similarity;
    for (const auto& [otherId, otherProducts] : data) {
        if (otherId == userId) continue;
        if (otherProducts.find(productId) == otherProducts.end()) continue;
        // For each remaining user, count how many of the target user's
        // products they also watched. Thats the similarity score.
        int common = 0;
        for (const auto& p : targetProducts) {
            if (otherProducts.count(p)) ++common;
        }
        similarity[otherId] = common;
    }
    // For each candidate product, sum the similarities of the users who watched it. 
    // Skip the target product and products the target user already watched.
    std::unordered_map<std::string, int> relevance;
    for (const auto& [otherId, sim] : similarity) {
        for (const auto& p : data.at(otherId)) {
            if (p == productId) continue;
            if (targetProducts.count(p)) continue;
            relevance[p] += sim;
        }
    }

    // Sort by relevance, then by product id (lexicographic).
    // Take the top 10. Skip zero relevance products.
    std::vector<std::pair<std::string, int>> items(relevance.begin(), relevance.end());
    std::sort(items.begin(), items.end(), [](const auto& a, const auto& b) {
        // If their relevance scores diffrent then the higher score wins.
        if (a.second != b.second) return a.second > b.second;
        // Otherwise the smaller product ID wins (lexicographic).
        return a.first < b.first;
    });

    std::vector<std::string> result;
    for (const auto& [id, score] : items) {
        if (score == 0) break;
        if (result.size() >= 10) break;
        result.push_back(id);
    }
    return result;
}