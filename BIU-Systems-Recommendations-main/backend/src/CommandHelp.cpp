#include "CommandHelp.h"

#include "command_manager.h"
#include <deque>
#include <string>

Help::Help(CommandManager* manager) : manager(manager) {}

std::string Help::help() { return ""; }

HTTP::Response Help::apply(std::deque<std::string>) {
    return {HTTP::Status::Ok, this->manager->help()};
}
