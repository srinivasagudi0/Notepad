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
}

function SaveCurrent() {
    const title = document.getElementById("note-title");
    const content = document.getElementById("note-content");
    if (title) {
        if (title.value.trim().length == 0){
            return;
        }
    }
    let note = [{
        id: Date.now()+"jkjj",
        title: title.value,
        pinned: false,
        updatedAt: new Date().toISOString(),
        content: content.value,
    }];
    localStorage.setItem("notepad-notes", JSON.stringify(notes))

    const status = document.getElementById("save-status")
    status.textContent = "Saved";
}

const NOTES = parse() || [];
