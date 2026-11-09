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

function parse(name) {
    const key = "notepad-notes";
    return JSON.parse((localStorage.getItem(key)).getItem(name))
}

const title = parse("title");
const pinned = parse("pinned");
const updatedAt = parse("updatedAt");
const content = parse("content");

document.getElementById("note-title").value = title;

function SaveCurrent() {
    const title = document.getElementById("note-title");
    const content = document.getElementById("note-content");
    if (title) {
        if (title.value.trim().length == 0){
            return;
        }
    }
    let note = {
        id: Date.now()+"jkjj",
        title: title.value,
        pinned: false,
        updatedAt: new Date().toISOString(),
        content: content.value,
    }
    localStorage.setItem("notepad-notes", JSON.stringify(note))

    const status = document.getElementById("save-status")
    status.textContent = "Saved";
}



