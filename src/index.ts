import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("WebSocket server is running!");
});

app.get("/ws", (c) => {
  const upgradeHeader = c.req.header("upgrade");
  if (upgradeHeader !== "websocket") {
    return c.text("Expected WebSocket", 426);
  }

  // @ts-ignore - WebSocketPair is available in Cloudflare Workers runtime
  const webSocketPair = new WebSocketPair();
  // @ts-ignore
  const client = webSocketPair[0];
  // @ts-ignore
  const server = webSocketPair[1];

  server.accept();

  server.send(
    JSON.stringify({
      type: "message",
      data: "Welcome to the WebSocket server!",
    })
  );

  server.addEventListener("message", (event: any) => {
    try {
      const data = JSON.parse(event.data.toString());
      // @ts-ignore - console is available in Cloudflare Workers runtime
      console.log("Received message:", data);

      server.send(
        JSON.stringify({
          type: "echo",
          data: data,
        })
      );
    } catch (error) {
      // @ts-ignore - console is available in Cloudflare Workers runtime
      console.error("Error parsing message:", error);
      server.send(
        JSON.stringify({
          type: "error",
          data: "Invalid message format",
        })
      );
    }
  });

  server.addEventListener("close", () => {
    // @ts-ignore - console is available in Cloudflare Workers runtime
    console.log("WebSocket connection closed");
  });

  server.addEventListener("error", (event: any) => {
    // @ts-ignore - console is available in Cloudflare Workers runtime
    console.error("WebSocket error:", event);
  });

  // @ts-ignore - Response with webSocket is valid in Cloudflare Workers
  return new Response(null, {
    status: 101,
    webSocket: client,
  });
});

export default app;
