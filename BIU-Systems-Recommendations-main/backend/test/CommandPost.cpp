
#include "../src/CommandPost.h"
#include <gtest/gtest.h>
#include <string>
#include <fstream>

// If user already exits in the file - should return error 404
TEST(PostTest, ExistingUserAddsProducts) {
    auto path = std::filesystem::temp_directory_path() / "post_test.txt";
    {
        std::ofstream file(path);
        file << "1: 100\n";
    }
    Post post(path);
    auto [status, message] = post.apply({"1", "200", "300"});
    EXPECT_EQ(status, HTTP::Status::BadRequest);
    std::filesystem::remove(path);
}
// If it's a new user - we accept it and return 201 
TEST(PostTest, NewUserAddsProducts) {
    auto path = std::filesystem::temp_directory_path() / "post_test.txt";
    {
        std::ofstream file(path);
        file << "1: 100\n";
    }
    Post post(path);
    auto [status, message] = post.apply({"2", "200", "300"});
    EXPECT_EQ(status, HTTP::Status::Created);
    EXPECT_EQ(message, "");
    std::filesystem::remove(path);
}
TEST(CommandPost_parse_args, FailOnEmpty) {
    auto opt = Post::parse_args({});
    EXPECT_FALSE(opt);
}

TEST(CommandPost_parse_args, FailOnOnlyUser) {
    auto opt = Post::parse_args({"user"});
    EXPECT_FALSE(opt);
}

TEST(CommandPost_parse_args, ParseUserAndOneProduct) {
    auto opt = Post::parse_args({"user", "product1"});
    EXPECT_TRUE(opt);
    auto [user, products] = opt.value();
    EXPECT_EQ(user, "user");
    std::unordered_set<std::string> expected_products = {"product1"};
    EXPECT_EQ(products, expected_products);
}

TEST(CommandPost_parse_args, ParseUserAndSomeProducts) {
    auto opt = Post::parse_args({"user", "product1", "product2", "product3"});
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