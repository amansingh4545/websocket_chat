import threading
import os

def run_websocket():
    os.system("python server.py")

def run_http():
    os.system("python -m http.server 8000 --directory client")

threading.Thread(target=run_websocket).start()
threading.Thread(target=run_http).start()
