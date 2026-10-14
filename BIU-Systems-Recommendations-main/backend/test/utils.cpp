#include <gtest/gtest.h>

#include <string>
#include <tuple>

#include "../src/utils.h"

using std::string;
using std::tuple;

TEST(Utils_SplitOnce, All) {
    {
        // no delimiter -> won't split
        auto result = split_once("no-spaces", " ");
        EXPECT_FALSE(result);
    }
    {
        // one character string delimiter
        auto opt_result = split_once("before after", " ");
        EXPECT_TRUE(opt_result);
        tuple<string, string> result = opt_result.value();
        tuple<string, string> expected{"before", "after"};
        EXPECT_EQ(result, expected);
    }
    {
        // string delimiter
        auto opt_result = split_once("beforemiddleafter", "middle");
        EXPECT_TRUE(opt_result);
        tuple<string, string> result = opt_result.value();
        tuple<string, string> expected{"before", "after"};
        EXPECT_EQ(result, expected);
    }
}

TEST(Utils_parse_line, All) {
    {
        // case: empty
        auto result = parse_line("");
        EXPECT_EQ(result, std::deque<string>());
    }
    {
        // case: normal
        auto result = parse_line("a b c");
        EXPECT_EQ(result, std::deque<string>({"a", "b", "c"}));
    }
    {
        // case: extra spaces
        auto result = parse_line("    a    b        c   ");
        EXPECT_EQ(result, std::deque<string>({"a", "b", "c"}));
    }
}

// Empty input string should produce an empty map.
TEST(Utils_DataFileParse, ParseDataEmptyInput) {
    auto data = parse_data_file_contents("");
    EXPECT_TRUE(data.empty());
}

// Parse a simple multi user input and verify the resulting map.
TEST(Utils_DataFileParse, ParseDataBasic) {
    auto data = parse_data_file_contents("1: 100 101\n2: 101 102\n");
    std::unordered_map<std::string, std::unordered_set<std::string>> expected = {
        {"1", {"100", "101"}},
        {"2", {"101", "102"}},
    };
    EXPECT_EQ(data, expected);
}

// If the same user appears on multiple lines, products must merge into one set, not duplicate.
TEST(Utils_DataFileParse, ParseDataMergesMultipleLinesForSameUser) {
    auto data = parse_data_file_contents("1: 100 101\n1: 102 103\n");
    std::unordered_set<std::string> expected = {"100", "101", "102", "103"};
    EXPECT_EQ(data["1"], expected);
}

// If a line has no products, the user should not be created.
TEST(Utils_DataFileParse, ParseDataIgnoresUserWithNoProducts) {
    auto data = parse_data_file_contents("1: 100\n5:\n2: 101\n");
    // User 5 should not exist
    EXPECT_EQ(data.count("5"), 0);
    EXPECT_EQ(data.count("1"), 1);
    EXPECT_EQ(data.count("2"), 1);
}

TEST(Utils_DataFileFormat, All) {
    {
        std::string result = format_data_file_contents({});
        std::string expected = "";
        EXPECT_EQ(result, expected);
    }
    {
        std::string result = format_data_file_contents({{"user", {}}});
        std::string expected = "";
        EXPECT_EQ(result, expected);
    }
    {
        std::string result = format_data_file_contents({{"user", {"product"}}});
        std::string expected = "user: product\n";
        EXPECT_EQ(result, expected);
    }
    {
        std::string result = format_data_file_contents({{"user", {"product1", "product2"}}});
        std::string expected = "user: product1 product2\n";
        EXPECT_EQ(result, expected);
    }
    {
        std::string result = format_data_file_contents({
            {"user1", {"product1", "product2"}},
            {"user2", {"product3", "product4"}},
        });
        std::string expected = "user1: product1 product2\n"
                               "user2: product3 product4\n";
        EXPECT_EQ(result, expected);
    }
}
