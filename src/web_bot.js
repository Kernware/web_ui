function createChatContainer() {
    // TODO: might create several functions

    fetch("https://github.com/Kernware/notebooks/blob/main/src/web_bot.css")
    .then(response => response.text())
    .then(css => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    })
    .catch(error => console.error("Failed to load CSS:", error));

    const chatContainer = document.createElement('div');
    chatContainer.id = 'kw-chatbot-container';

    const resizeHandleLeft = document.createElement('div');
    resizeHandleLeft.id = 'kw-resize-handle-left';
    chatContainer.appendChild(resizeHandleLeft);

    const resizeHandleTop = document.createElement('div');
    resizeHandleTop.id = 'kw-resize-handle-right';
    chatContainer.appendChild(resizeHandleTop);

    const header = document.createElement('div');
    header.id = 'kw-header';
    header.innerHTML = '<span>Kernware Assistent</span>';

    header.addEventListener('click', () => {
        if (isMinimized) {
            chatContainer.style.height = '400px';
            messagesDiv.style.display = 'block';
            startersDiv.style.display = 'block';
            inputDiv.style.display = 'flex';

            resizeHandleLeft.style.display = 'flex';
            resizeHandleTop.style.display = 'flex';

            header.style.borderRadius = "0 0 0 0";
        } else {
            chatContainer.style.height = '40px';
            messagesDiv.style.display = 'none';
            startersDiv.style.display = 'none';
            inputDiv.style.display = 'none';

            resizeHandleLeft.style.display = 'none';
            resizeHandleTop.style.display = 'none';

            header.style.borderRadius = "5px 5px 5px 5px";
        }
        isMinimized = !isMinimized;
    });

    const messagesDiv = document.createElement('div');
    messagesDiv.id = 'kw-chat-messages';

    const startersDiv = document.createElement('div');
    startersDiv.id = 'kw-starter-questions';

    // TODO: load from backend
    const starters = [
        "Was macht Kernware?",
        "Kernware Assistent?"
    ];
    starters.forEach(query => {
        const btn = document.createElement('button');
        btn.id = "kw-start-btns";
        btn.textContent = query;
        btn.addEventListener('click', () => sendMessage(query));
        startersDiv.appendChild(btn);
    });

    const inputDiv = document.createElement('div');
    inputDiv.id = 'kw-input-divs';

    const input = document.createElement('input');
    input.id = 'kw-input-txt';
    input.type = 'text';
    input.placeholder = 'Frag mich etwas :)';
    inputDiv.appendChild(input);

    const sendBtn = document.createElement('button');
    sendBtn.id = 'kw-send-btn';
    sendBtn.textContent = 'Send';
    inputDiv.appendChild(sendBtn);

    // Assemble chat container
    chatContainer.appendChild(header);
    chatContainer.appendChild(messagesDiv);
    chatContainer.appendChild(startersDiv);
    chatContainer.appendChild(inputDiv);
    document.body.appendChild(chatContainer);


    let isMinimized = true;
    let isResizingLeft = false;
    let isResizingTop = false;
    let startX, startY, startWidth, startHeight;

    sendBtn.addEventListener('click', () => sendMessage(input.value));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage(input.value);
    });

    resizeHandleLeft.addEventListener('mousedown', (e) => {
        isResizingLeft = true;
        startX = e.pageX;
        startWidth = parseInt(window.getComputedStyle(chatContainer).width, 10);
    });

    resizeHandleTop.addEventListener('mousedown', (e) => {
        isResizingTop = true;
        startY = e.pageY;
        startHeight = parseInt(window.getComputedStyle(chatContainer).height, 10);
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizingLeft) {
            const diff = startX - e.pageX;
            let newWidth = startWidth + diff;
            newWidth = Math.max(200, Math.min(600, newWidth));
            chatContainer.style.width = `${newWidth}px`;
        }

        if (isResizingTop) {
            const diff = startY - e.pageY;
            let newHeight = startHeight + diff;
            newHeight = Math.max(40, Math.min(600, newHeight));
            chatContainer.style.height = `${newHeight}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizingLeft) {
            isResizingLeft = false;
        }
        if (isResizingTop) {
            isResizingTop = false;
        }
    });

    function addMessage(message, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.textContent = message;
        msgDiv.style.cssText = `
            margin: 5px 0;
            padding: 8px;
            border-radius: 5px;
            max-width: 80%;
            ${isUser ? 
                'background: #9bcf9b; color: white; margin-left: auto;' : 
                'background: #e9ecef; color: black;'}
        `;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function sendMessage(message) {
        if (!message.trim()) return;
        
        addMessage(message, true);
        input.value = '';
        startersDiv.style.display = 'none';

        // TODO: add real backend and 
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockResponse = `You said: "${message}". (This is a demo response)`;
            addMessage(mockResponse);
        } catch (error) {
            addMessage('Sorry, something went wrong!');
            console.error('Chatbot error:', error);
        }
    }
}