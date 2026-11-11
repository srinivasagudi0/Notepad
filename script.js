let notes = [];
let activeNoteId = null;

function countWords() {
    const text = document.getElementById("note-content").value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById("word-count").textContent = words + "words";
    const charecters = text.length;
    document.getElementById("char-count").textContent = charecters +" charecters";
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
    document.getElementById("editor-type").value = notes[0].contentFormat || "text";

    document.getElementById("note-title").value = notes[0].title;
    document.getElementById("note-content").value = notes[0].content;
    countWords();
    document.getElementById("save-status").textContent = "Saved";
}

function SaveCurrent() {
   const note = notes.find(n => n.id === activeNoteId);
   if (!note) return;

   note.title = document.getElementById("note-title").value;
   note.content = document.getElementById("note-content").value;
   note.contentFormat = document.getElementById("editor-type").value;
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

    document.getElementById("note-title").value = "";
    document.getElementById("note-content").value = "";
    countWords();

    localStorage.setItem("notepad-notes", JSON.stringify(notes));
    document.getElementById("save-status").textContent = "Saved";
    renderNotes();
}

function addElements(){
    // add elements based on what mode the editor is. In md and html it shows preview and nothing for text.
    editorType = document.getElementById("editor-type").value;
    const htmlPreview = document.getElementById("html-preview");
    const markdownPreview = document.getElementById("markdown-preview");
    if (editorType === "html") {
        htmlPreview.hidden = false;
        const content = document.getElementById("note-content").value;
        htmlPreview.srcdoc = content;
     } else if (editorType === "markdown") {
        htmlPreview.hidden = true;
        const content = document.getElementById("note-content").value;
        markdownPreview.hidden = false;
        markdownPreview.innerHTML = convertToMarkdown(content);
    } else {
        htmlPreview.hidden = true;
        markdownPreview.hidden = true;
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
    document.getElementById("note-title").value = note.title;
    document.getElementById("note-content").value = note.content;
    countWords();
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

    });


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

    const blob = new Blob([note.content], {
        type: "text/plain;charset=utf-8"
    })
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
    }, 1000);

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

allListeners();
