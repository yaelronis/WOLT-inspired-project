#include "../src/Get.h"
#include "../src/command_manager.h"
#include "../src/utils.h"

#include <gtest/gtest.h>
#include <sstream>
#include <string>
#include <vector>

// Tests for the "get" command (was "recommend").
// The compute() tests call the algorithm directly.
// The get_recommendations() tests check the core that apply() delegates to.

// The example from the ex1.
const std::string APPENDIX_DATA =
    "1: 100 101 102 103\n"
    "2: 101 102 104 105 106\n"
    "3: 100 104 105 107 108\n"
    "4: 101 105 106 107 109 110\n"
    "5: 100 102 103 105 108 111\n"
    "6: 100 103 104 110 111 112 113\n"
    "7: 102 105 106 107 108 109 110\n"
    "8: 101 104 105 106 109 111 114\n"
    "9: 100 103 105 107 112 113 115\n"
    "10: 100 102 105 106 107 109 110 116\n";

// The worked example from ex1.
TEST(GetTest, ComputeAppendixExample) {
    Get g("");
    auto data = parse_data_file_contents(APPENDIX_DATA);
    auto recs = g.compute("1", "104", data);

    std::vector<std::string> expected = {
        "105", "106", "111", "110", "112", "113", "107", "108", "109", "114"
    };
    EXPECT_EQ(recs, expected);
}

// When two products have equal relevance- the smaller product id
// must come first (lexicographic).
TEST(GetTest, ComputeTieBreakerSmallerProductIdFirst) {
    Get g("");
    auto data = parse_data_file_contents("1: 100\n2: 100 999 200\n");
    auto recs = g.compute("1", "100", data);
    std::vector<std::string> expected = {"200", "999"};
    EXPECT_EQ(recs, expected);
}

// The result must contain at most 10 products even when more candidates exist.
TEST(GetTest, ComputeReturnsAtMostTen) {
    std::stringstream s;
    s << "1: 100\n2: 100";
    for (int i = 200; i < 215; ++i) s << " " << i;
    s << "\n";

    Get g("");
    auto data = parse_data_file_contents(s.str());
    auto recs = g.compute("1", "100", data);

    EXPECT_EQ(recs.size(), 10);
}

// compute() itself still produces recommendations for an unknown user. 
// Note: the apply() in an unknown user returns 404.
TEST(GetTest, ComputeUnknownUserStillGetsRecommendations) {
    Get g("");
    auto data = parse_data_file_contents("1: 100 101\n2: 100 102\n");
    auto recs = g.compute("999", "100", data);

    std::vector<std::string> expected = {"101", "102"};
    EXPECT_EQ(recs, expected);
}

// Products the target user has already watched must never be recommended back to them.
TEST(GetTest, ComputeDoesNotRecommendAlreadyWatchedProducts) {
    Get g("");
    auto data = parse_data_file_contents("1: 100 101\n2: 100 101 102\n");
    auto recs = g.compute("1", "100", data);
    for (const auto& r : recs)
        EXPECT_NE(r, "101");
}

// Products with a relevance score of zero must be excluded from the output.
TEST(GetTest, ComputeExcludesZeroRelevanceProducts) {
    Get g("");
    auto data = parse_data_file_contents("1: 100\n2: 100 101\n3: 100\n");
    auto recs = g.compute("1", "100", data);
    std::vector<std::string> expected = {"101"};
    EXPECT_EQ(recs, expected);
}

// When no other user has watched the target product, there are
// no recommendations and the result is empty.
TEST(GetTest, ComputeNoRecommendationsWhenNoOtherUserWatchedProduct) {
    Get g("");
    auto data = parse_data_file_contents("1: 100\n");
    auto recs = g.compute("1", "100", data);
    EXPECT_TRUE(recs.empty());
}

// get_recommendations() tests- it takes the raw arguments and the data file contents as a string,
// and returns the HTTP::Response (status + body).

// 200- success cases tests.

// A valid get for an existing user must return 200 Ok with the
// recommended- using the PDF example.
TEST(GetRecommendations, OkReturnsRecommendationsAsBody) {
    Get g("");
    auto [status, body] = g.get_recommendations({"1", "104"}, APPENDIX_DATA);

    EXPECT_EQ(status, HTTP::Status::Ok);
    EXPECT_EQ(body, "105 106 111 110 112 113 107 108 109 114");
}

// An existing user with no recommendations must still return 200 Ok with an empty body 
// (the user exists, the request succeeded, there simply were no results).
TEST(GetRecommendations, OkWithEmptyBodyWhenNoRecommendations) {
    Get g("");
    // user 1 exists but no other user watched product 100.
    auto [status, body] = g.get_recommendations({"1", "100"}, "1: 100\n");

    EXPECT_EQ(status, HTTP::Status::Ok);
    EXPECT_EQ(body, "");
}

// 404 Not Found- user doesn't exist tests

// A get for a userid that doesn't appear in the data
// must return 404 Not Found with an empty body.
TEST(GetRecommendations, NotFoundUnknownUser) {
    Get g("");
    auto [status, body] =
        g.get_recommendations({"999", "100"}, "1: 100 101\n2: 100 102\n");

    EXPECT_EQ(status, HTTP::Status::NotFound);
    EXPECT_EQ(body, "");
}

// When the contents are empty (data file was missing or empty), no users exist,
// so any get must return 404 Not Found.
TEST(GetRecommendations, NotFoundWhenContentsEmpty) {
    Get g("");
    auto [status, body] = g.get_recommendations({"1", "100"}, "");

    EXPECT_EQ(status, HTTP::Status::NotFound);
}

// 400 Bad Request- malformed arguments tests.

// A get with no arguments must return 400 Bad Request.
TEST(GetRecommendations, BadRequestNoArgs) {
    Get g("");
    auto [status, body] = g.get_recommendations({}, "1: 100 101\n");

    EXPECT_EQ(status, HTTP::Status::BadRequest);
    EXPECT_EQ(body, "");
}

// A get with only one argument (userid, no productid) must return 400 Bad Request.
TEST(GetRecommendations, BadRequestOneArg) {
    Get g("");
    auto [status, body] = g.get_recommendations({"1"}, "1: 100 101\n");

    EXPECT_EQ(status, HTTP::Status::BadRequest);
}

// A get with more than two arguments must return 400 Bad Request.
// (the command takes exactly a userid and a productid).
TEST(GetRecommendations, BadRequestTooManyArgs) {
    Get g("");
    auto [status, body] = g.get_recommendations({"1", "100", "extra"}, "1: 100 101\n");

    EXPECT_EQ(status, HTTP::Status::BadRequest);
}