// @ts-check

import { exit } from "process";
import path from "path";

import express from "express";
import cors from "cors";

import * as backend from "./backend.js";
import { router as users_router } from "./route/users.js";
import { router as tokens_router } from "./route/tokens.js";
import { router as restaurant_router } from "./route/restaurants.js";
import { router as products_router } from "./route/products.js";
import { router as search_router } from "./route/search.js"
import { router as orders_router } from "./route/orders.js";

import { set_recommender, backend_recommender, memory_recommender } from "./service/recommender.js";
import { connect_db } from "./db.js";

function parse_args() {
        // get relative program file path.
        const cwd = process.cwd();
        const program_path = process.argv[1];
        const program = program_path.startsWith(cwd)
            ? program_path.replace(cwd, '')
            : program_path;
        // parse arguments. host/port are optional- when omitted, an in-process
        // recommender is used so the app runs standalone (no external ex2 server).
        if (process.argv.length === 2) return null;
        const backend_host = process.argv[2];
        const backend_port = Number(process.argv[3]);
        if ((process.argv.length !== 4) || isNaN(backend_port)) {
            console.log(`usage: ${program} [backend host: string] [backend port: number]`);
            exit(1);
        }
        return { backend_host, backend_port }
    }

const PORT = 3000;
const args = parse_args();

/**
 * Setup at app startup- connects the orders code to a recommender.
 * The orders code doesn't talk to the backend directly, it only uses the recommender
 * interface, so we inject the implementation here:
 *  - with a host/port- the real ex2 backend over the network (for grading).
 *  - without args- an in-process recommender so the app runs standalone.
 * The backend returns the status as a number object, so we convert it to a number.
*/
if (args) {
    backend.set_config({ host: args.backend_host, port: args.backend_port })
    set_recommender(backend_recommender({
        post: async (user, products) => ({ status: Number((await backend.post(user, products)).status) }),
        patch: async (user, products) => ({ status: Number((await backend.patch(user, products)).status) }),
    }));
    console.log(`recommender: ex2 backend at ${args.backend_host}:${args.backend_port}`);
} else {
    set_recommender(memory_recommender());
    console.log('recommender: in-process (standalone). Pass <host> <port> to use the ex2 server.');
}

const client_build_dir = path.join(import.meta.dirname, '../../client/web/build');

const app = express();
app.use(cors({}));
app.use(express.json({ limit: '5mb'}));
app.use(express.static(client_build_dir))

app.use("/api/users", users_router);
app.use("/api/tokens", tokens_router);
app.use("/api/restaurants", restaurant_router);
app.use("/api/restaurants/:id/products", products_router);
app.use("/api/search", search_router);
app.use("/api/orders", orders_router);

// fallback page
app.get(/^(?!\/api\/)/, (req, res) => {
    const index_file = path.join(client_build_dir, 'index.html');
    return res.sendFile(index_file);
});

// Models default to their MongoDB backend (see each model file), so no storage
// wiring is needed here- we just open the shared connection before serving.
await connect_db();
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));