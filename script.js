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

    document.getElementById("note-title").value = notes[0].title;
    document.getElementById("note-content").value = notes[0].content;
    countWords();
    document.getElementById("save-status").textContent = "Saved";
    renderNotes();
}

function SaveCurrent() {
   const note = notes.find(n => n.id === activeNoteId);
   if (!note) return;

   note.title = document.getElementById("note-title").value;
   note.content = document.getElementById("note-content").value;
   note.updatedAt = new Date().toISOString();

    localStorage.setItem("notepad-notes", JSON.stringify(notes));
    document.getElementById("save-status").textContent = "Saved";
    renderNotes();
}

function CreateNote() {
    if (activeNoteId) {
        SaveCurrent();
    }

    const note = {
        id: crypto.randomUUID(),
        title: "",
        content: "",
        pinned: false,
        updatedAt: new Date().toISOString()
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

function renderNotes() {

    const search = document.getElementById("search-notes").value.toLowerCase().trim();

    const notesList = document.getElementById("notes-list");
    notesList.innerHTML = "";

    const sortedNotes = notes.filter(note => note.title.toLowerCase().includes(search) ||
    note.content.toLowerCase().includes(search)).sort((a, b) => {
        return Number(b.pinned)- Number(a.pinned) 
    })

    sortedNotes.forEach(note => { 
        const noteElement = document.createElement("button");
        if (note.pinned) {
            noteElement.classList.add("pinned");
        }   
        noteElement.textContent = `${note.pinned ? "📌 " : ""}${note.title || "Untitled"}`;
        notesList.appendChild(noteElement);
        noteElement.addEventListener("click", () => {
            openNote(note.id);
        });
        if(note.id === activeNoteId) {
            noteElement.classList.add("active");
        }
    }); 
}

function openNote(id) {
    if (activeNoteId) {
        SaveCurrent();
    }

    const note = notes.find(n => n.id === id);
    if (!note) return;

    activeNoteId = note.id;
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
    SaveCurrent();
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.json";
    a.click();

    URL.revokeObjectURL(url);
}

function toggleWhite() {
   title = document.getElementById("title")
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
    actions=document.querySelectorAll("#action button");
    actions.style.borderColor="white"; // make it apply to all button not jsut save
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

function ToggleTheme() {
    // 5 themes: cyberpunk, darkest, light, fantasy+ retro, christmas
    toggleDark();
}

allListeners();

toggleRetro();