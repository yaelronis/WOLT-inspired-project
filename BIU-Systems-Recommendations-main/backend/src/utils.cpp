#include <deque>
#include <map>
#include <optional>
#include <set>
#include <sstream>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <cctype>
#include <algorithm>

using std::istringstream;
using std::optional;
using std::string;
using std::tuple;
using std::unordered_map;
using std::unordered_set;

optional<tuple<string, string>> split_once(const string& text, const string& delimiter) {
    string::size_type index = text.find(delimiter);
    // if not found, return empty
    if (index == string::npos) {
        return {};
    }
    // get text before, after delimiter
    string before = text.substr(0, index);
    string after = text.substr(index + delimiter.length());
    return {{before, after}};
}

std::deque<string> parse_line(string text) {
    std::deque<std::string> out;
    do {
        auto [entry, rest_of_entries] = split_once(text, " ").value_or(std::make_tuple(text, ""));
        // keep only non-empty
        if (!entry.empty()) {
            out.push_back(entry);
        }
        text = rest_of_entries;
    } while (!text.empty());
    return out;
}

unordered_map<string, unordered_set<string>> parse_data_file_contents(const string& content) {
    unordered_map<string, unordered_set<string>> data;
    // Wrap the string in an istringstream so we can read it line by line
    // with the same getline() we'd use on a file.
    istringstream input(content);
    string line;
    while (getline(input, line)) {
        // Replace ':' with a space to read everything as tokens.
        replace(line.begin(), line.end(), ':', ' ');
        // Extract the first token (the user ID). If extraction fails
        // (empty line), skip it.
        istringstream iss(line);
        string userId;
        if (!(iss >> userId))
            continue;
        // Read products until the line is exhausted. Insert each into the users set.
        string prod;
        while (iss >> prod) {
            data[userId].insert(prod);
        }
    }
    return data;
}

string format_data_file_contents(const unordered_map<string, unordered_set<string>>& data) {
    // sort keys and values for consistency and testability
    std::map<string, unordered_set<string>> data_sorted_by_key(data.begin(), data.end());
    std::ostringstream out;
    // formatted as lines: `{user}: {product} ...`
    for (auto [user, products] : data_sorted_by_key) {
        std::set<string> products_sorted(products.begin(), products.end());
        if (products_sorted.empty()) {
            continue;
        }
        out << user << ":";
        for (string product : products_sorted) {
            out << " " << product;
        }
        out << "\n";
    }
    return out.str();
}

string upperString(string text) {
    for (char& c : text) {
        c = std::toupper(c);
    }
    return text;
}
