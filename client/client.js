let socket;
let Name;
let current_users;

document.getElementById("wel").style.display = "flex";
document.getElementById("nameInput").focus();

document.getElementById("nameInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        joinChat();
    }
});

document.getElementById("messageInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

function joinChat() {
    Name = document.getElementById("nameInput").value.trim();
    if (!Name) return alert("Enter your name!");

    socket = new WebSocket("ws://localhost:12345/chat");
    socket.onopen = function () {
        socket.send(Name);
    };

    document.getElementById("greet").textContent = `Hello, ${Name}!`;
    document.getElementById("greet").style.display = "flex";
    document.getElementById("wel").style.display = "none";
    document.getElementById("chatContainer").style.display = "flex";
    document.getElementById("messageInput").focus();

    socket.onmessage = event => {
        let data;
        try { data = JSON.parse(event.data); } catch { data = event.data; }

        if (data.type === "users") {
            current_users = data.users;
            const ul = document.getElementById("userList");
            ul.innerHTML = "";
            data.users.forEach(user => {
                if (user !== Name) {
                    const li = document.createElement("li");
                    const img = document.createElement("img");
                    img.src = "user_icon.png";
                    img.alt = "user";
                    img.classList.add("user-icon");

                    const span = document.createElement("span");
                    span.textContent = user;

                    li.appendChild(img);
                    li.appendChild(span);
                    li.onclick = () => insertPrivateTo(user);
                    ul.appendChild(li);
                }
            });
        }
        else if (data.type === "file") {
            const messagesDiv = document.getElementById("messages");
            const msg = document.createElement("p");
            msg.classList.add("msg");

            const isFromMe = data.from === Name;
            msg.classList.add(isFromMe ? "right" : "left");
            
            const isImage = data.filetype.startsWith("image/");
            if (isImage) {
                const container = document.createElement("div");
                container.classList.add("message-container");

                // Sender name
                const sender = document.createElement("span");
                sender.classList.add("message-sender");
                if(data.to === ""){
                    const from = data.from === Name ? "You" : data.from;
                    sender.textContent = `${from} : `;
                }else{
                    msg.classList.add("private");
                    const from = data.from;
                    sender.textContent = `${from} \u2192 ${data.to} : `;
                    if(from == Name){
                        sender.textContent = sender.textContent.replace(Name, "You");
                    }else{
                        sender.textContent = sender.textContent.replace(`${data.to}`, "You");
                    }
                }

                // Message text
                const messageText = document.createElement("span");
                messageText.classList.add("message-text");
                messageText.textContent = data.message || "";

                // Wrap sender and message together
                const textWrapper = document.createElement("div");
                textWrapper.classList.add("message-text-wrapper");
                textWrapper.appendChild(sender);
                textWrapper.appendChild(messageText);

                // Image
                const img = document.createElement("img");
                img.src = `data:${data.filetype};base64,${data.data}`;
                img.alt = data.filename;
                img.classList.add("message-image");

                // Append to container
                container.appendChild(textWrapper);
                container.appendChild(img);
                msg.appendChild(container);
            }            
            else {
                // Wrap sender + message into one line
                const messageLine = document.createElement("div");
                messageLine.classList.add("message-line");
            
                const sender = document.createElement("span");
                sender.classList.add("message-sender");
            
                if (data.to === "") {
                    const from = data.from === Name ? "You" : data.from;
                    sender.textContent = `${from} : `;
                } else {
                    msg.classList.add("private");
                    const from = data.from;
                    sender.textContent = `${from} \u2192 ${data.to} : `;
                    if (from === Name) {
                        sender.textContent = sender.textContent.replace(Name, "You");
                    } else {
                        sender.textContent = sender.textContent.replace(`${data.to}`, "You");
                    }
                }
            
                const messageText = document.createElement("span");
                messageText.classList.add("message-text");
                messageText.textContent = data.message || "";
            
                messageLine.appendChild(sender);
                messageLine.appendChild(messageText);
            
                // File link below
                const fileLink = document.createElement("a");
                fileLink.href = `data:${data.filetype};base64,${data.data}`;
                fileLink.download = data.filename;
                fileLink.className = "file-link";
            
                const text = document.createElement("span");
                text.textContent = `📁 ${data.filename}`;
                fileLink.appendChild(text);
            
                msg.appendChild(messageLine);
                msg.appendChild(fileLink);
                messagesDiv.appendChild(msg);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }                      
            messagesDiv.appendChild(msg);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        else if(data.type === "normal_message"){
            const messagesDiv = document.getElementById("messages");
            const msg = document.createElement("p");
            msg.classList.add("msg");
        
            const isFromMe = data.from === Name;
            msg.classList.add(isFromMe ? "right" : "left");
        
            // Sender name
            const sender = document.createElement("span");
            sender.classList.add("message-sender");
            if(data.to === ""){
                const from = data.from === Name ? "You" : data.from;
                sender.textContent = `${from} : `;
            }else{
                msg.classList.add("private");
                const from = data.from;
                sender.textContent = `${from} \u2192 ${data.to} : `;
                if(from == Name){
                    sender.textContent = sender.textContent.replace(Name, "You");
                }else{
                    sender.textContent = sender.textContent.replace(`${data.to}`, "You");
                }
            }
        
            // Message text
            const messageText = document.createElement("span");
            messageText.classList.add("message-text");
            messageText.textContent = data.message || "";
        
            msg.appendChild(sender);
            msg.appendChild(messageText);
        
            messagesDiv.appendChild(msg);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        else if (data.type === "error"){
            alert(data.error);
        } 
    };
}
function sendMessage() {
    const input = document.getElementById("messageInput").value.trim();
    if(input.startsWith("[to:")){
        let user_name = "";
        let user_flag = 0;
        let user_message = "";
        let message_flag = 0;
        for(let i =0; i<input.length; i++){
            if(input[i] == ':' && message_flag == 0){
                user_flag = 1;
                continue;
            }else if(input[i] == ']'){
                user_flag = 0;
                message_flag = 1;
                continue;
            }
            if(user_flag){
                user_name += input[i];
            }else if(message_flag){
                user_message += input[i];
            }
        }
        user_name = user_name.trim();
        user_message = user_message.trim();
        if(current_users.includes(user_name)){
            if(user_message){
                socket.send(JSON.stringify({
                    type: "normal_message",
                    to: user_name,
                    message: user_message,
                }));  
                document.getElementById("messageInput").value = "";
            }
        }else{
            alert("This user name does not exist.")
            document.getElementById("messageInput").value = "";
        }
    }
    else if (input) {
        socket.send(JSON.stringify({
            type: "normal_message",
            to: "",
            message: input,
        }));  
        document.getElementById("messageInput").value = "";
    }
}

document.getElementById("fileInput").addEventListener("change", function () {
    const file = this.files[0];
    this.value = "";
    if (!file) return;

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File too large. Maximum allowed is ${MAX_SIZE_MB}MB.`);
        return;
    }
    const reader = new FileReader();
    reader.onload = function () {
        const base64 = reader.result.split(",")[1];
        const input = document.getElementById("messageInput").value.trim();
        let user_name = "";
        let user_message = "";
        if(input.startsWith("[to:")){
            let user_flag = 0;
            let message_flag = 0;
            for(let i =0; i<input.length; i++){
                if(input[i] == ':' && message_flag == 0){
                    user_flag = 1;
                    continue;
                }else if(input[i] == ']'){
                    user_flag = 0;
                    message_flag = 1;
                    continue;
                }
                if(user_flag){
                    user_name += input[i];
                }else if(message_flag){
                    user_message += input[i];
                }
            }
            user_name = user_name.trim();
            user_message = user_message.trim();
            if(!current_users.includes(user_name)){
                alert("This user name does not exist.")
                document.getElementById("messageInput").value = "";
                return;
            }
        }else if(input){
            user_message = input;
        }
        socket.send(JSON.stringify({
            type: "file",
            to: user_name,
            message: user_message,
            filename: file.name,
            filetype: file.type,
            data: base64
        }));  
        document.getElementById("messageInput").value = "";
    };
    reader.readAsDataURL(file);
});

function insertPrivateTo(username) {
    const input = document.getElementById("messageInput");
    input.value = `[to: ${username}] `;
    input.focus();
}