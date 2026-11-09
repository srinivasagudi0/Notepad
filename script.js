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

document.getElementById("note-title").addEventListener("input", countWords);
document.getElementById("note-content").addEventListener("input", countWords);

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
        id: Date.now()+ "asjias",
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

document.getElementById('new-note').addEventListener('click', CreateNote);


function renderNotes() {
    const notesList = document.getElementById("notes-list");
    notesList.innerHTML = "";

    notes.forEach(note => { 
        const noteElement = document.createElement("button");
        noteElement.textContent = note.title || "Untitled";
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

function deleteNote() {
    const confirm = window.confirm("Are you sure you want to delete this note?");
    if (!confirm) return;
    const noteID = notes.find(n => n.id === activeNoteId);

    if (!noteID) return;
    notes = notes.filter(n => n.id !== activeNoteId);
    localStorage.removeItem("notepad-notes");
    activeNoteId = null;
    document.getElementById("note-title").value = "";
    document.getElementById("note-content").value = "";
    countWords();
    document.getElementById("save-status").textContent = "Deleted";
    renderNotes();
}

document.getElementById("delete-note").addEventListener("click", deleteNote);