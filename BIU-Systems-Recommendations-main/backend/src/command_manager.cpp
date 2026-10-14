#include "./command_manager.h"

#include "./tcp.h"
#include "./utils.h"

#include <map>
#include <memory>
#include <optional>
#include <string>
#include <utility>

using std::string;

namespace HTTP {
    std::string format_status(Status status) {
        switch (status) {
            case Ok:
                return "Ok";
            case Created:
                return "Created";
            case NoContent:
                return "No Content";
            case BadRequest:
                return "Bad Request";
            case NotFound:
                return "Not Found";
            case InternalServerError:
                return "Internal Server Error";
        }
        std::unreachable();
    }

    std::string format_response(Response response) {
        auto [status_code, message] = response;
        std::string status = std::to_string(status_code) + " " + HTTP::format_status(status_code);
        if (message.empty()) {
            return status + "\n";
        }
        return status + "\n\n" + message + "\n";
    }
}

Command::~Command() {}

CommandManager& CommandManager::add(std::string name, std::unique_ptr<Command> command) {
    name = upperString(name);
    this->commands[name] = std::move(command);
    return *this;
}

std::optional<std::shared_ptr<Command>> CommandManager::get(std::string name) {
    name = upperString(name);
    if (!this->commands.contains((name))) {
        return {};
    }
    return this->commands[name];
}

std::optional<HTTP::Response> CommandManager::handle_line(std::string line) {
    auto arguments = parse_line(line);
    // empty line, malformed request
    if (arguments.empty()) {
        return {};
    }
    string command_name = arguments.front();
    arguments.pop_front();
    // find command, skip if not found
    auto maybe_command = this->get(command_name);
    if (!maybe_command) {
        return {{HTTP::Status::BadRequest, ""}};
    }
    // execute
    Command* command = maybe_command->get();
    return command->apply(arguments);
}

void CommandManager::mainloop(std::unique_ptr<TCP::Server> server) {
    // currently only supports a single client
    // this will be changed in the future
    while (true) {
        TCP::Client client = server->accept();
        while (auto maybe_input = server->receive(client)) {
            std::string input = maybe_input.value();
            HTTP::Response response;
            try {
                auto maybe_response = this->handle_line(input);
                // request is empty -> no response
                if (!maybe_response) {
                    continue;
                }
                response = maybe_response.value();
            } catch (...) {
                response = {HTTP::Status::InternalServerError, ""};
            }
            std::string output = HTTP::format_response(response);
            server->send(client, output);
        }
    }
}

std::string CommandManager::help() {
    std::string out;
    // each line: "{name} {syntax}"
    for (auto [name, command] : this->commands) {
        if (name == "HELP") {
            continue;
        }
        string help = command->help();
        out += name;
        if (help.length()) {
            out += ", arguments: " + help;
        }
        out += "\n";
    }
    if (this->commands.contains(("HELP"))) {
        out += "help";
    }
    return out;
}
