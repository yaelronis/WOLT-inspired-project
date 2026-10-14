#include <gtest/gtest.h>
#include <memory>

#include "../src/command_manager.h"

class SavesInput : public Command {
    public:
        std::string last_input;

        std::string help() override { return "[args]"; }
        HTTP::Response apply(std::deque<std::string> arguments) override {
            std::string content = this->last_input = arguments.empty() ? "" : arguments.front();
            return {HTTP::Status::Ok, content};
        }
};

TEST(CommandManager, InputHandling) {
    CommandManager mgr = CommandManager();
    mgr.add("echo", std::make_unique<SavesInput>());
    // unsafe: do not cast like this outside of testing
    auto echo = (SavesInput*)mgr.get("echo")->get();
    // no input
    mgr.handle_line("echo");
    EXPECT_EQ(echo->last_input, "");
    // has input
    mgr.handle_line("echo input");
    EXPECT_EQ(echo->last_input, "input");
}

TEST(CommandManager, HelpText) {
    CommandManager mgr = //
        CommandManager()
            .add("echo2", std::make_unique<SavesInput>())
            .add("echo1", std::make_unique<SavesInput>())
            .add("echo3", std::make_unique<SavesInput>());
    std::string expected = {"ECHO1, arguments: [args]\n"
                            "ECHO2, arguments: [args]\n"
                            "ECHO3, arguments: [args]\n"};
    EXPECT_EQ(mgr.help(), expected);
}
