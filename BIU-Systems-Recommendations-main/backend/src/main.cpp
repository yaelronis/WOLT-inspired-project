#include <expected>
#include <memory>
#include <stdexcept>
#include <string>

#include "./CommandHelp.h"
#include "./CommandPatch.h"
#include "./CommandPost.h"
#include "./Delete.h"
#include "./Get.h"
#include "./command_manager.h"

#include "tcp.h"

typedef struct Args {
    public:
        int port;
} Args;

/** parses arguments from command line */
std::expected<Args, std::string> parse_args(int argc, char* argv[]) {
    // argv: [program, port: int]
    std::string program{argv[0]};
    if (argc != 2) {
        return std::unexpected("usage: " + program + " {port}");
    }
    // parse port
    std::string port_str{argv[1]};
    int port;
    try {
        port = std::stoi(port_str);
    } catch (std::invalid_argument) {
        return std::unexpected("port must be an integer, got: " + port_str);
    }
    // done
    return Args{.port = port};
};

int main(int argc, char* argv[]) {
    std::string data_file_path = "./data/data.txt";
    // parse args
    auto args_result = parse_args(argc, argv);
    if (!args_result) {
        throw std::runtime_error(args_result.error());
    }
    Args args = args_result.value();
    // config, mainloop
    auto server = TCP::Server::bind(args.port);
    server->listen(1);
    auto mgr = CommandManager();
    mgr.add("patch", std::make_unique<Patch>(data_file_path))
        .add("post", std::make_unique<Post>(data_file_path))
        .add("delete", std::make_unique<Delete>(data_file_path))
        .add("get", std::make_unique<Get>(data_file_path))
        .add("help", std::make_unique<Help>(&mgr));
    mgr.mainloop(std::move(server));
    return 0;
}
