#include "../src/Delete.h"
#include "../src/command_manager.h"
#include "../src/utils.h"

#include <gtest/gtest.h>
#include <string>
#include <unordered_set>

// 400 Bad Request-bad arguments

// parse_args must reject a empty argument list.
// A Delete with no userid is not a valid command.
TEST(Delete_parse_args, FailOnEmpty) {
    auto opt = Delete::parse_args({});
    EXPECT_FALSE(opt);
}

// parse_args must reject a request that contains only a userid.
// Requires at least one productid. userid alone is invalid.
TEST(Delete_parse_args, FailOnOnlyUser) {
    auto opt = Delete::parse_args({"user"});
    EXPECT_FALSE(opt);
}

// parse_args must accept the minimum valid form (userid + 1 productid).
TEST(Delete_parse_args, ParseUserAndOneProduct) {
    auto opt = Delete::parse_args({"user", "product1"});
    EXPECT_TRUE(opt);
    auto [user, products] = opt.value();
    EXPECT_EQ(user, "user");
    std::unordered_set<std::string> expected_products = {"product1"};
    EXPECT_EQ(products, expected_products);
}

// parse_args must accept multiple productids and collect them all into the returned set.
TEST(Delete_parse_args, ParseUserAndSomeProducts) {
    auto opt = Delete::parse_args({"user", "product1", "product2", "product3"});
    EXPECT_TRUE(opt);
    auto [user, products] = opt.value();
    EXPECT_EQ(user, "user");
    std::unordered_set<std::string> expected_products = {
        "product1",
        "product2",
        "product3",
    };
    EXPECT_EQ(products, expected_products);
}

// delete_products() tests- takes the data file contents as a string and returns
// {status, updated_contents}. We check the status and parse
// the returned string to check the resulting state.

// 204 No Content- success cases

// Deleting only one product from a user with several products.
// Should return 204 No Content and remove only that product.
TEST(Delete_products, SuccessRemovesSingleProduct) {
    auto [status, updated] =
        Delete::delete_products("1: 100 101 102\n", "1", {"101"});

    EXPECT_EQ(status, HTTP::Status::NoContent);

    auto data = parse_data_file_contents(updated);
    std::unordered_set<std::string> expected = {"100", "102"};
    EXPECT_EQ(data["1"], expected);
}

// Deleting multiple products in a one delete call.
// Should return 204 and remove all listed products at once.
TEST(Delete_products, SuccessRemovesMultipleProducts) {
    auto [status, updated] =
        Delete::delete_products("1: 100 101 102 103\n", "1", {"101", "103"});

    EXPECT_EQ(status, HTTP::Status::NoContent);

    auto data = parse_data_file_contents(updated);
    std::unordered_set<std::string> expected = {"100", "102"};
    EXPECT_EQ(data["1"], expected);
}

// A delete for user 1 must not touch user 2 data.
TEST(Delete_products, SuccessDoesNotAffectOtherUsers) {
    auto [status, updated] =
        Delete::delete_products("1: 100 101\n2: 100 101 102\n", "1", {"100"});

    EXPECT_EQ(status, HTTP::Status::NoContent);

    auto data = parse_data_file_contents(updated);
    std::unordered_set<std::string> expected_user1 = {"101"};
    std::unordered_set<std::string> expected_user2 = {"100", "101", "102"};
    EXPECT_EQ(data["1"], expected_user1);
    EXPECT_EQ(data["2"], expected_user2);
}

// Delete is deleting a product the user never had.
// must still return 204 (success) not 404 and leave the products unchanged.
TEST(Delete_products, SuccessDeletingProductUserDoesNotHave) {
    auto [status, updated] =
        Delete::delete_products("1: 100 101\n", "1", {"999"});

    EXPECT_EQ(status, HTTP::Status::NoContent);

    auto data = parse_data_file_contents(updated);
    std::unordered_set<std::string> expected = {"100", "101"};
    EXPECT_EQ(data["1"], expected);
}

// Deleting ALL of a user's products should remove the user's line from the data entirely.
TEST(Delete_products, SuccessDeletingAllProductsRemovesUserLine) {
    auto [status, updated] =
        Delete::delete_products("1: 100 101\n2: 200\n", "1", {"100", "101"});

    EXPECT_EQ(status, HTTP::Status::NoContent);

    auto data = parse_data_file_contents(updated);
    EXPECT_EQ(data.count("1"), 0);
    std::unordered_set<std::string> expected_user2 = {"200"};
    EXPECT_EQ(data["2"], expected_user2);
}

// 404 Not Found- user doesn't exist tests

// delete for a userid that doesn't appear in the data
// must return 404 Not Found and empty contents.
TEST(Delete_products, NotFoundUnknownUser) {
    auto [status, updated] =
        Delete::delete_products("1: 100 101\n2: 200 201\n", "999", {"100"});

    EXPECT_EQ(status, HTTP::Status::NotFound);
    EXPECT_EQ(updated, "");
}

// When the contents are empty (data file was missing or empty) then no users exist.
// Any delete must return 404 Not Found.
TEST(Delete_products, NotFoundWhenContentsEmpty) {
    auto [status, updated] =
        Delete::delete_products("", "1", {"100"});

    EXPECT_EQ(status, HTTP::Status::NotFound);
    EXPECT_EQ(updated, "");
}