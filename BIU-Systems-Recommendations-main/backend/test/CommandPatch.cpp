
#include "../src/CommandPatch.h"
#include <gtest/gtest.h>
#include <string>
#include <fstream>

// If user already exists in the file - should return no content
TEST(PatchTest, ExistingUserAddsProducts) {
    auto path = std::filesystem::temp_directory_path() / "patch_test.txt";
    {
        std::ofstream file(path);
        file << "1: 100\n";
    }
    Patch patch(path);
    auto [status, message] = patch.apply({"1", "200", "300"});
    EXPECT_EQ(status, HTTP::Status::NoContent);
    std::filesystem::remove(path);
}
// If it's a new user - we return not found 404
TEST(PatchTest, NewUserAddsProducts) {
    auto path = std::filesystem::temp_directory_path() / "patch_test.txt";
    {
        std::ofstream file(path);
        file << "1: 100\n";
    }
    Patch patch(path);
    auto [status, message] = patch.apply({"2", "200", "300"});
    EXPECT_EQ(status, HTTP::Status::NotFound);
    EXPECT_EQ(message, "");
    std::filesystem::remove(path);
}

TEST(CommandPatch_parse_args, FailOnEmpty) {
    auto opt = Patch::parse_args({});
    EXPECT_FALSE(opt);
}

TEST(CommandPatch_parse_args, FailOnOnlyUser) {
    auto opt = Patch::parse_args({"user"});
    EXPECT_FALSE(opt);
}

TEST(CommandPatch_parse_args, ParseUserAndOneProduct) {
    auto opt = Patch::parse_args({"user", "product1"});
    EXPECT_TRUE(opt);
    auto [user, products] = opt.value();
    EXPECT_EQ(user, "user");
    std::unordered_set<std::string> expected_products = {"product1"};
    EXPECT_EQ(products, expected_products);
}

TEST(CommandPatch_parse_args, ParseUserAndSomeProducts) {
    auto opt = Patch::parse_args({"user", "product1", "product2", "product3"});
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