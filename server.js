const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5500);
const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
};

const server = http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" });
        response.end("Method not allowed");
        return;
    }

    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
        response.writeHead(400);
        response.end("Bad request");
        return;
    }

    const filePath = path.resolve(root, `.${pathname}`);
    const relativePath = path.relative(root, filePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.stat(filePath, (statError, stats) => {
        if (statError) {
            response.writeHead(404);
            response.end("Not found");
            return;
        }

        const targetPath = stats.isDirectory()
            ? path.join(filePath, "index.html")
            : filePath;

        fs.readFile(targetPath, (readError, content) => {
            if (readError) {
                if (readError.code !== "ENOENT") {
                    console.error(`Unable to read ${targetPath}:`, readError);
                }
                response.writeHead(readError.code === "ENOENT" ? 404 : 500);
                response.end(readError.code === "ENOENT" ? "Not found" : "Internal server error");
                return;
            }

            response.writeHead(200, {
                "Content-Type": contentTypes[path.extname(targetPath).toLowerCase()] || "application/octet-stream",
            });
            response.end(request.method === "HEAD" ? undefined : content);
        });
    });
});

server.listen(port, "127.0.0.1", () => {
    console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
