import { Editor } from "https://cdn.jsdelivr.net/npm/@tiptap/core@3.31.3/+esm";
import StarterKit from "https://cdn.jsdelivr.net/npm/@tiptap/starter-kit@3.31.3/+esm";

let notes = [];
let activeNoteId = null;
let loadingDocument = false;
const richEditor = new Editor({
    element: document.getElementById("rich-text-content"),
    extensions: [
        StarterKit
    ],
    content: "<p>Start writing your note here...</p>"
});

function countWords() {
    updateDocumentStats();
    document.getElementById("save-status").textContent = "Not Saved";
}

function parse() {
    const key = "notepad-notes";
    const data = localStorage.getItem(key);
    if (!data) {return [];}
    try {
        const saved = JSON.parse(data);
        if (Array.isArray(saved)) {
            return saved;
        }
        return [saved];
    } catch (e) {
        console.error("Error parsing note data:", e);
        return [];;
    }
}

notes = parse();
if (notes.length > 0) {
    activeNoteId = notes[0].id;
    loadNoteIntoEditors(notes[0]);
}

function SaveCurrent() {
   const note = notes.find(n => n.id === activeNoteId);
   if (!note) return;

   note.title = document.getElementById("note-title").value;
   const mode = note.contentFormat || "text";

    if (mode === "richtext") {
        note.content = richEditor.getHtml();
    } else {
        note.content = document.getElementById("note-content").value;
    }
    note.updatedAt = new Date().toISOString();

    localStorage.setItem("notepad-notes", JSON.stringify(notes));
    document.getElementById("save-status").textContent = "Saved";
    renderNotes();
}

function CreateNote() {
    if (activeNoteId) {
        SaveCurrent();
    }

    const selectElement = document.getElementById("editor-type");
    let editorType = selectElement.value;

  

    const note = {
        id: crypto.randomUUID(),
        title: "",
        content: "",
        contentFormat: editorType, // like markdown, txt or html or more i dont know
        pinned: false,
        updatedAt: new Date().toISOString(),
        revision: 0,
        ownerId: null,
        collaborators: [],
        shareMode: (""|| "private")
    };
    notes.push(note);
    activeNoteId = note.id;

    loadNoteIntoEditors(note);
    countWords();
    clearInterval(saveTimer);
    localStorage.setItem("notepad-notes", JSON.stringify(notes));
    document.getElementById("save-status").textContent = "Saved";
    renderNotes();
}

function addElements(){
    // add elements based on what mode the editor is. In md and html it shows preview and nothing for text.
    const mode = document.getElementById("editor-type").value;
    const textarea = document.getElementById("note-content");
    const rich = document.getElementById("rich-text-editor");
    const html = document.getElementById("html-preview");
    const markdown = document.getElementById("markdown-preview");

    textarea.hidden = mode === "richtext";
    rich.hidden = mode !== "richtext";
    markdown.hidden = mode !== "markdown";
    html.hidden = mode !== "html";

    
    if (mode === "html") {
        html.srcdoc = textarea.value;
    }
    if (mode === "markdown") {
        markdown.innerHTML = convertToMarkdown(textarea.value);
    }
}

function convertToMarkdown(content) {
    const html = marked.parse(content);
    return DOMPurify.sanitize(html);
}

function renderNotes() {
    const search = document.getElementById("search-notes").value.toLowerCase().trim();
    const notesList = document.getElementById("notes-list");

    notesList.innerHTML = "";

    const sortedNotes = notes.filter(note => 
        note.title.toLowerCase().includes(search) ||
        note.content.toLowerCase().includes(search)
    ).sort((a, b) => {
        return Number(b.pinned) - Number(a.pinned);
    });

    sortedNotes.forEach(note => {
        const noteElement = document.createElement("button");

        if (note.pinned) {
            noteElement.classList.add("pinned");
        }

        noteElement.textContent = `${note.pinned ? "📌 " : ""}${note.title || "Untitled"}`;

        noteElement.addEventListener("click", () => {
            openNote(note.id);
        });

        if (note.id === activeNoteId) {
            noteElement.classList.add("active");
        }

        notesList.appendChild(noteElement);
    });

    themes[themeIndex]();

    const activeButton = document.querySelector("#notes-list button.active");

    if (activeButton) {
        activeButton.style.outline = "2px solid #007bff";
        activeButton.style.outlineOffset = "-2px";
        activeButton.style.fontWeight = "bold";
    }
}

function openNote(id) {
    if (activeNoteId) {
        SaveCurrent();
    }

    const note = notes.find(n => n.id === id);
    if (!note) return;

    activeNoteId = note.id;
    document.getElementById("editor-type").value = note.contentFormat || "text";
    loadNoteIntoEditors();
    countWords();
    clearInterval(saveTimer);
    document.getElementById("save-status").textContent = "Saved";
    renderNotes();
}

function allListeners() {
    document.getElementById("note-title").addEventListener("input", countWords);
    document.getElementById("note-content").addEventListener("input", countWords);
    document.getElementById("delete-note").addEventListener("click", deleteNote);
    document.getElementById("note-pin").addEventListener("click", pinNote);
    document.getElementById("search-notes").addEventListener("input", renderNotes);
    document.getElementById("export-note").addEventListener("click", exportNotes);  
    document.getElementById('new-note').addEventListener('click', CreateNote);
    document.getElementById("theme-toggle").addEventListener('click', ToggleTheme);
    document.getElementById("editor-type").addEventListener('change', () => {
        const note = notes.find(n => n.id === activeNoteId);
        if (!note) return;

        note.contentFormat = document.getElementById("editor-type").value;
        localStorage.setItem("notepad-notes", JSON.stringify(notes));
    })
    document.getElementById("note-content").addEventListener("input", addElements);
    document.getElementById("note-title").addEventListener("input", autoSave);
    document.getElementById("note-content").addEventListener("input", autoSave);
    document.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            SaveCurrent();
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
            event.preventDefault();
            document.getElementById("search-notes").focus();
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
            event.preventDefault();
            CreateNote();
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
            event.preventDefault();
            exportNotes();
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
            event.preventDefault();
            deleteNote();
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
            event.preventDefault();
            pinNote();
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
            event.preventDefault();
            ToggleTheme();
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "h") {
            event.preventDefault();
            document.getElementById("note-content").focus();
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "m") {
            event.preventDefault();
            document.getElementById("note-title").focus();
        }
        document.getElementById("save-note").addEventListener("click", SaveCurrent);

        richEditor.on("update", () => {
            if (loadingDocument) return;
            const note = notes.find(n => n.id === activeNoteId);
            if (!note || note.contentFormat !== 'richtext') return;
            updateDocumentStats();
            document.getElementById("save-status").textContent = "Not Saved";
            autoSave();
        });
        connectRichToolbar();
    });

    document.getElementById("find-button").addEventListener("click", findText);
    document.getElementById("replace-button").addEventListener("click", replaceText);
    document.getElementById("replace-all-button").addEventListener("click", replaceAllText);
    document.getElementById("showFR").addEventListener('click', showFinder);
    document.getElementById("hideFR").addEventListener('click', hideFinder);
    
}

function deleteNote() {
    const confirm = window.confirm("Are you sure you want to delete this note?");
    if (!confirm) return;
    const noteID = notes.find(n => n.id === activeNoteId);

    if (!noteID) return;
    notes = notes.filter(n => n.id !== activeNoteId);
    localStorage.setItem("notepad-notes", JSON.stringify(notes));
    activeNoteId = null;
    document.getElementById("note-title").value = "";
    document.getElementById("note-content").value = "";
    countWords();
    document.getElementById("save-status").textContent = "Deleted";
    renderNotes();
}

function pinNote() {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    note.pinned = !note.pinned;
    localStorage.setItem("notepad-notes", JSON.stringify(notes));
    renderNotes();
}

function exportNotes() {
    if(!activeNoteId) {
        alert("No note selected to export");
        return;
    }
    SaveCurrent();
    
    const note = notes.find(n=>n.id === activeNoteId);
    if(!note) {
        alert("Note not found");
        return;
    }
    const textToExport = note.contentFormat === "richtext"
        ? richEditor.getText()
        : note.content;
    const blob = new Blob([textToExport], {
        type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url
    
    const fileName = (note.title.trim() || "Untitled").replace(/[^a-zA-Z0-9]/g, '_') + ".txt";
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    a.remove()
    window.open(url, "_blank");

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 3000); // saving every 3 seconds instead of 1

}   

function toggleWhite() {
    const body = document.getElementById("page");
    body.style.backgroundColor = "#f4f7fb";

    const title = document.getElementById("title");
    title.style.color = "#2563eb";

    const newNote = document.getElementById("new-note");
    newNote.style.backgroundColor = "#2563eb";
    newNote.style.borderColor = "#1d4ed8";
    newNote.style.color = "#ffffff";

    const search = document.getElementById("search-notes");
    search.style.backgroundColor = "#ffffff";
    search.style.color = "#1e293b";
    search.style.borderColor = "#cbd5e1";

    const noteTitle = document.getElementById("note-title");
    noteTitle.style.backgroundColor = "#ffffff";
    noteTitle.style.color = "#2563eb";
    noteTitle.style.borderColor = "#cbd5e1";
    noteTitle.style.marginBottom = "5px";

    const noteContent = document.getElementById("note-content");
    noteContent.style.backgroundColor = "#ffffff";
    noteContent.style.color = "#1e293b";
    noteContent.style.borderColor = "#cbd5e1";
    noteContent.style.marginBottom = "10px";

    const actions = document.querySelectorAll("#action button");
    actions.forEach(button => {
        button.style.backgroundColor = "#ffffff";
        button.style.color = "#2563eb";
        button.style.borderColor = "#bfdbfe";
    });

    const stats = document.getElementById("note-stats");
    stats.style.color = "#64748b";

    const noteButtons = document.querySelectorAll("#notes-list button");
    noteButtons.forEach(button => {
        button.style.backgroundColor = "#ffffff";
        button.style.color = "#334155";
        button.style.borderColor = "#e2e8f0";
    });
}

function toggleDark() {
    body = document.getElementById("page");
    body.style.backgroundColor = 'black';
    title = document.getElementById("title")
    title.style.color = 'white';
    newNote = document.getElementById("new-note");
    newNote.style.backgroundColor ='black';
    newNote.style.borderColor='white'
    newNote.style.color = 'white';
    search = document.getElementById("search-notes")
    search.style.backgroundColor = "black";
    search.style.color = "white";
    noteTitle = document.getElementById("note-title");
    noteTitle.style.backgroundColor = "black";
    noteTitle.style.marginBottom = "5px";
    noteTitle.style.borderColor ="green";
    noteContent = document.getElementById("note-content");
    noteContent.style.backgroundColor="black";
    noteContent.style.color ="white";
    noteContent.style.marginBottom = "10px";
    const actions=document.querySelectorAll("#action button");
    actions.forEach(button => {
        button.style.borderColor="white";
    });
    stats = document.getElementById("note-stats")
    stats.style.color ="white";
};

const findElements = document.getElementById("find-replace");
const showButtton = document.getElementById("showFR");
function showFinder() {
    findElements.hidden = false;
    showButtton.hidden = true;
}
function hideFinder() {
    findElements.hidden=true;
    showButtton.hidden=false;

}

function toggleCyberpunk() {
    const body = document.getElementById("page");
    body.style.backgroundColor = "#090014";

    const title = document.getElementById("title");
    title.style.color = "#ff00ff";

    const newNote = document.getElementById("new-note");
    newNote.style.backgroundColor = "#17002e";
    newNote.style.borderColor = "#ff00ff";
    newNote.style.color = "#00ffff";

    const search = document.getElementById("search-notes");
    search.style.backgroundColor = "#17002e";
    search.style.color = "#00ffff";
    search.style.borderColor = "#ff00ff";

    const noteTitle = document.getElementById("note-title");
    noteTitle.style.backgroundColor = "#17002e";
    noteTitle.style.color = "#00ffff";
    noteTitle.style.borderColor = "#ff00ff";
    noteTitle.style.marginBottom = "5px";

    const noteContent = document.getElementById("note-content");
    noteContent.style.backgroundColor = "#17002e";
    noteContent.style.color = "#ffffff";
    noteContent.style.borderColor = "#ff00ff";
    noteContent.style.marginBottom = "10px";

    const actions = document.querySelectorAll("#action button");
    actions.forEach(button => {
        button.style.backgroundColor = "#17002e";
        button.style.borderColor = "#ff00ff";
        button.style.color = "#00ffff";
    });

    const stats = document.getElementById("note-stats");
    stats.style.color = "#ff00ff";

    const noteButtons = document.querySelectorAll("#notes-list button");
    noteButtons.forEach(button => {
        button.style.backgroundColor = "#17002e";
        button.style.color = "#00ffff";
        button.style.borderColor = "#ff00ff";
    });
}

function toggleRetro() {
    const body = document.getElementById("page");
    body.style.backgroundColor = "#0e3f01ce";

    const title = document.getElementById("title");
    title.style.color = "#614124";

    const newNote = document.getElementById("new-note");
    newNote.style.backgroundColor = "#fff4db";
    newNote.style.borderColor = "#9c7749";
    newNote.style.color = "#614124";

    const search = document.getElementById("search-notes");
    search.style.backgroundColor = "#fff4db";
    search.style.color = "#614124";
    search.style.borderColor = "#9c7749";

    const noteTitle = document.getElementById("note-title");
    noteTitle.style.backgroundColor = "#fff4db";
    noteTitle.style.color = "#614124";
    noteTitle.style.borderColor = "#9c7749";
    noteTitle.style.marginBottom = "5px";

    const noteContent = document.getElementById("note-content");
    noteContent.style.backgroundColor = "#fff4db";
    noteContent.style.color = "#614124";
    noteContent.style.borderColor = "#9c7749";
    noteContent.style.marginBottom = "10px";

    const actions = document.querySelectorAll("#action button");
    actions.forEach(button => {
        button.style.backgroundColor = "#fff4db";
        button.style.borderColor = "#9c7749";
        button.style.color = "#614124";
    });

    const stats = document.getElementById("note-stats");
    stats.style.color = "#614124";

    const noteButtons = document.querySelectorAll("#notes-list button");
    noteButtons.forEach(button => {
        button.style.backgroundColor = "#fff4db";
        button.style.color = "#614124";
        button.style.borderColor = "#9c7749";
    });
}

function toggleChristmas() {
    const body = document.getElementById("page");
    body.style.backgroundColor = "#103b2b";

    const title = document.getElementById("title");
    title.style.color = "#ffffff";

    const newNote = document.getElementById("new-note");
    newNote.style.backgroundColor = "#a30000";
    newNote.style.borderColor = "#d4af37";
    newNote.style.color = "#ffffff";

    const search = document.getElementById("search-notes");
    search.style.backgroundColor = "#fffaf0";
    search.style.color = "#a30000";
    search.style.borderColor = "#d4af37";

    const noteTitle = document.getElementById("note-title");
    noteTitle.style.backgroundColor = "#fffaf0";
    noteTitle.style.color = "#a30000";
    noteTitle.style.borderColor = "#d4af37";
    noteTitle.style.marginBottom = "5px";

    const noteContent = document.getElementById("note-content");
    noteContent.style.backgroundColor = "#fffaf0";
    noteContent.style.color = "#103b2b";
    noteContent.style.borderColor = "#d4af37";
    noteContent.style.marginBottom = "10px";

    const actions = document.querySelectorAll("#action button");
    actions.forEach(button => {
        button.style.backgroundColor = "#a30000";
        button.style.borderColor = "#d4af37";
        button.style.color = "#ffffff";
    });

    const stats = document.getElementById("note-stats");
    stats.style.color = "#ffffff";

    const noteButtons = document.querySelectorAll("#notes-list button");
    noteButtons.forEach(button => {
        button.style.backgroundColor = "#fffaf0";
        button.style.color = "#a30000";
        button.style.borderColor = "#d4af37";
    });
}

let themeIndex = Number(localStorage.getItem("themeIndex")) || 0;
const themes = [toggleWhite,toggleDark, toggleCyberpunk, toggleRetro, toggleChristmas];
if (themeIndex < 0 || themeIndex >= themes.length) {
    themeIndex = 0;
}

renderNotes();
function ToggleTheme() {
    themeIndex++;
    if (themeIndex > 4) {
        themeIndex = 0;
    }
    themes[themeIndex]();
    localStorage.setItem("themeIndex", themeIndex); 
}

let saveTimer;
function autoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        SaveCurrent();
    }, 1000)
}

function findText() {
    const findInput =  document.getElementById("find-text").value;
    const doc = document.getElementById("note-content").value;

    if (findInput.trim() === "") {
        alert("Please enter text to find");
        return;
    }

    const findIndex = doc.indexOf(findInput);
    if (findIndex !== -1) {
        document.getElementById("note-content").focus();
        document.getElementById("note-content").setSelectionRange(findIndex, findIndex + findInput.length);
    } else {
        alert("Text not found");
    }
}

function replaceText() {
    const findInput = document.getElementById("find-text").value;
    const replaceInput = document.getElementById("replace-text").value;
    const doc = document.getElementById("note-content").value;

    if (findInput.trim() === "") {
        alert("Please enter text to find");
        return;
    }
    
    const findIndex = doc.indexOf(findInput);
    if (findIndex !== -1) {
        const newDoc = doc.substring(0, findIndex) + replaceInput + doc.substring(findIndex + findInput.length);
        document.getElementById("note-content").value = newDoc;
        addElements();
        countWords();
        autoSave();
    } else {
        alert("Text not found");
    }
}

function replaceAllText() {
    const findInput = document.getElementById("find-text").value;
    const replaceInput = document.getElementById("replace-text").value;
    const doc = document.getElementById("note-content").value;

    if (findInput.trim() === "") {
        alert("Please enter text to find");
        return;
    }

    const newDoc = doc.split(findInput).join(replaceInput);
    document.getElementById("note-content").value = newDoc;
    addElements();
    countWords();
    autoSave();
}

function connectRichToolbar() {
    const actions = {
        "bold-button": () => richEditor.chain().focus().togglebold().run(),
        "italic-button": () => richEditor.chain().focus().toggleItalic().run(),
        "strike-button": () => richEditor.chain().focus().toggleStrike().run(),
        "heading1": () => richEditor.chain().focus().toggleHeading({ level: 1 }).run(),
        "heading2": () => richEditor.chain().focus().toggleHeading({ level: 2 }).run(),
        "bulleted-list": () => richEditor.chain().focus().toggleBulletList().run(),
        "numbered-list": () => richEditor.chain().focus().toggleOrderedList().run()
    };
    Object.entries(actions).forEach(([id, action]) => {
        document.getElementById(id).addEventListener("click", action);
    })
}

function loadNoteIntoEditors(note) {
    document.getElementById("note-title").value = note.title;
    document.getElementByIf("editor-type").value = note.contentFormat || "text";
    if (note.contentFormat === "richtext") {
        richEditor.commands.setContent(note.content || "<p></p>");
        document.getElementById("note-content").value = "";
    } else {
        document.getElementById("note-content").value = note.content || "";
        richEditor.commands.setContent("<p></p>");
    }
    addElements();
    // updateDocumentStats();
    document.getElementById("save-status").textContent = "Saved";
}

function updateDocumentStats() {
    const mode = document.getElementById("editor-type").value;
    let text = "";

    if (mode === "richtext") {
        text = richEditor.getText();
    } else {
        text = document.getElementById("note-content").value;
    }

    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;

    document.getElementById("word-count").textContent = words + " words";
    document.getElementById("char-count").textContent = characters + " characters";
}

function fillSample() {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    const doc = document.getElementById("note-content").value;
    const confirm = window.confirm("All of the text will be erased and replaced by sample.");

    if (!confirm) return;

    const mode = note.contentFormat || "text";
    let placeholder;

    if (mode === "html") {
        placeholder = "<html></html>";
    };
    if (mode === "text") {
        placeholder = "Hi! This a Notepad made by Srinivasa. It is smart and supports 4 formats('html', 'rich', 'markdown' and 'text'). Thanks for using this application."
    } 
    if (mode === "markdown") {
        placeholder = "# Hello! "
    }
}

function changeFooter() {
    const footer = document.getElementById("footer");
    // footer will be tips mostly (2-3 norm sentences)
    tips = [
        "There are four themes(white, dark, fantasy & christmas).",
        "Made with love!",
        "Pin moves the note to the top of list.",
        "What you are reading are tips"
    ]
    tip = int(Math.random() * (tips.length))
    footer.textContent = tip;
}

allListeners();

// plan: after all the app is done, I will add ai (for correcting spell errros, autofill, predict next and will think more abiout this)
