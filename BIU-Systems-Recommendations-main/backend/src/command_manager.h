#pragma once

#include "tcp.h"
#include <deque>
#include <map>
#include <memory>
#include <optional>
#include <string>
#include <tuple>

namespace HTTP {

    enum Status : unsigned short {
        // success
        Ok = 200,
        Created = 201,
        NoContent = 204,
        // client error
        BadRequest = 400,
        NotFound = 404,
        // server error, this is to be used when a command fails unexpectedly.
        InternalServerError = 500
    };

    using Response = std::tuple<Status, std::string>;

    std::string format_status(Status status);

    std::string format_response(Response response);
}

class Command {
    public:
        // get help text for this command
        virtual std::string help() = 0;
        // apply this command's procedure.
        // note: commands may assume arguments aren't empty and don't contain spaces
        virtual HTTP::Response apply(std::deque<std::string> arguments) = 0;
        // empty destructor
        virtual ~Command();
};

class CommandManager {
    private:
        // commands this object will lookup and apply during `mainloop`
        std::map<std::string, std::shared_ptr<Command>> commands;
    
    public:
        // add a command, to be executed when
        // `{name} [{args}]` is inputted in mainloop
        CommandManager& add(std::string name, std::unique_ptr<Command> owned_command);

        // get a command by name, if found
        std::optional<std::shared_ptr<Command>> get(std::string name);

        // main loop:
        // - get new client, until disconnect:
        // - - receive, parse request
        // - - if request non-empty, execute request
        // - - send response
        void mainloop(std::unique_ptr<TCP::Server> server);

        // handles one line of input in mainloop:
        // - find command by name, skip if none found
        // - call command with arguments
        // * useful for testing mainloop
        std::optional<HTTP::Response> handle_line(std::string);

        // gets all help texts, by alphabetical order
        std::string help();
};
