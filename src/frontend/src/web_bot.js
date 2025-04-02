
function createChatContainer() {

    let session_token = localStorage.getItem('session_token');
    if (!session_token) {
        session_token = crypto.randomUUID();
        localStorage.setItem('session_token', session_token);
    }
    let starters_shown = false;
    let question_history = [];

    fetch("https://cdn.jsdelivr.net/gh/Kernware/web_ui@main/src/web_bot.css")
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
    resizeHandleTop.id = 'kw-resize-handle-top';
    chatContainer.appendChild(resizeHandleTop);

    const header = document.createElement('div');
    header.id = 'kw-header';
    header.innerHTML = `
        <span class="kw-header-text" data-tooltip="Einfacher Assistent basierend auf llama3.2 3B Model,&#10;beantwortet nur Fragen spezifisch zu Kernware.&#10;Have fun :)">
            Kernware Assistent
        </span>
    `;

    header.addEventListener('click', () => {
        if (isMinimized) {
            chatContainer.style.height = '400px';
            messagesDiv.style.display = 'block';
            if (!starters_shown) {
                startersDiv.style.display = 'block';
            }
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
        "Was ist Kernware?",
        "Was macht Kernware besonders?"
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
            user-select: text;
            ${isUser ?
                'background: #9bcf9b; color: white; margin-left: auto;' :
                'background: #e9ecef; color: black;'}
        `;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function sendMessage(message) {
        starters_shown = true;
        if (!message.trim()) return;

        addMessage(message, true);
        input.value = '';
        startersDiv.style.display = 'none';

        const spinner = document.createElement('div');
        spinner.classList.add('spinner');
        messagesDiv.appendChild(spinner);

        try {
            // simple CORS request to avoid preflight requests
            const backendUrl = `http://10.13.37.64:10103/chat?query=${encodeURIComponent(message)}&history=${encodeURIComponent(JSON.stringify(question_history))}&token=${encodeURIComponent(session_token)}`;
            const response = await fetch(backendUrl);
            if (!response.ok) {
                throw new Error('Backend error');
            }

            const data = await response.json();
            const backendResponse = data.response || 'Backend müde...';

            question_history.push([message, backendResponse]);
            addMessage(backendResponse);
        }
        catch (error) {
            addMessage('Backend müde, backend schlafen... Zzz');
            console.error('Chatbot error:', error);
        }
        finally {
            spinner.remove();
        }
    }
}
