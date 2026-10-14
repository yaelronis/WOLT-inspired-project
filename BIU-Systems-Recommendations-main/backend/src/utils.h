#pragma once

#include <deque>
#include <optional>
#include <sstream>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>

using std::istringstream;
using std::optional;
using std::string;
using std::tuple;
using std::unordered_map;
using std::unordered_set;

/**
 * splits a string on a delimiter, into an optional 2-tuple of strings.
 * if no delimiter present, returns none.
 */
optional<tuple<string, string>> split_once(const string& text, const string& delimiter);

// splits line of text by spaces, keeping non-empty entries
std::deque<string> parse_line(string text);

// parse data file contents from string
// TODO?: return optional as this may fail
unordered_map<string, unordered_set<string>> parse_data_file_contents(const string& content);

// format string as contents of data file
string format_data_file_contents(const unordered_map<string, unordered_set<string>>& data);

// convert the given string to uppercase
string upperString(string text);