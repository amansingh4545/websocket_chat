import asyncio
import websockets
import json

import os
PORT = int(os.environ.get("PORT", 12345))

clients = {}  # websocket -> name
name_to_ws = {}  # name -> websocket
monitor_clients = set()

async def broadcast_user_list():
    user_list = list(clients.values())
    msg = json.dumps({ "type": "users", "users": user_list })
    for ws in clients:
        await ws.send(msg)
    for monitor in monitor_clients:
        await monitor.send(msg)

async def handler(websocket, path):
    if path == "/monitor":
        monitor_clients.add(websocket)
        await websocket.send(json.dumps({ "type": "users", "users": list(clients.values()) }))
        try:
            async for _ in websocket:
                pass
        finally:
            monitor_clients.remove(websocket)
        return

    # First message = username
    name = await websocket.recv()
    if name.lower() in (n.lower() for n in name_to_ws):
        await websocket.send(json.dumps({ "type": "error", "error": "User with this name already exist."}))
    else:
        clients[websocket] = name
        name_to_ws[name] = websocket
        await broadcast_user_list()

        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if data.get("type") == "file":
                        file_payload = {
                            "type": "file",
                            "from": name,
                            "to": data["to"],
                            "message": data["message"],
                            "filename": data["filename"],
                            "filetype": data["filetype"],
                            "data": data["data"]
                        }
                    elif data.get("type") == "normal_message":
                        file_payload = {
                            "type": "normal_message",
                            "from": name,
                            "to": data["to"],
                            "message": data["message"],
                        }
                    # private msg
                    if data.get("to") != "":
                        recipient_name = data.get("to")
                        recipient_ws = name_to_ws.get(recipient_name)
                        if recipient_ws:
                            await recipient_ws.send(json.dumps(file_payload))
                            await websocket.send(json.dumps(file_payload))
                            for monitor in monitor_clients:
                                await monitor.send(json.dumps(file_payload))
                            continue
                    else: # broadcast
                        for ws in clients:
                            await ws.send(json.dumps(file_payload))
                        for monitor in monitor_clients:
                            await monitor.send(json.dumps(file_payload))
                    continue

                except json.JSONDecodeError:
                    pass

        except Exception as e:
            print(f"Error: {e}")

        finally:
            clients.pop(websocket, None)
            name_to_ws.pop(name, None)
            await broadcast_user_list()


async def main():
    async with websockets.serve(handler, "0.0.0.0", PORT, max_size = 7 * 1024 * 1024):
        print("WebSocket server running at ws://localhost:12345")
        while True:
            await asyncio.sleep(1)


asyncio.run(main())
