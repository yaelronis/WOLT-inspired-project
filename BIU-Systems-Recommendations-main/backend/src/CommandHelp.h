#pragma once
#include "command_manager.h"
#include <string>

// prints help text from all commands in the associated command anager
class Help : public Command {
    public:
        // requires command manager to iterate it's commands
        Help(CommandManager* manager);

        // takes no arguments
        std::string help() override;

        // prints all help texts
        HTTP::Response apply(std::deque<std::string>) override;

    private:
        CommandManager* manager;
};