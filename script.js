import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {marked} from "marked";
import DOMPurify from "dompurify";


let notes = [];
let activeNoteId = null;
let loadingDocument = false;
const richEditor = new Editor({
    element: document.getElementById("rich-text-content"),
    extensions: [
        StarterKit.configure({
            gapcursor: false,
            dropcursor: false,
        })
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
        return [];
    }
}

notes = parse();
notes = notes.filter(note => note && note.id).map(note => ({
    ...note,
    title: note.title || "",
    content: note.content || "",
    contentFormat: note.contentFormat || "text",
    pinned: Boolean(note.pinned)
}));
if (notes.length > 0) {
    activeNoteId = notes[0].id;
    loadNoteIntoEditors(notes[0]);
}

function SaveCurrent() {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;
    const oldContent = note.content
    const oldTitle = note.title;
    const oldMode = note.contentFormat || "text"

   note.title = document.getElementById("note-title").value;
   const mode = note.contentFormat || "text";

    if (mode === "richtext") {
        note.content = richEditor.getHTML();
    } else {
        note.content = document.getElementById("note-content").value;
    }
    note.updatedAt = new Date().toISOString();
    if (oldContent !== note.content || oldTitle !== note.title) {
    saveVersion(note, oldTitle, oldContent, oldMode);
    showActivity("Note Saved");
    }


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
    showActivity("New Note Created!");
}

function animateEditorChange() {
    const mode = document.getElementById("editor-type").value;

    const target = mode === "richtext" ? document.getElementById("rich-text-editor") : mode === "html"? document.getElementById("html-preview") : mode === "markdown" ? document.getElementById("markdown-preview") : document.getElementById("note-content");
    if (!target) return;

    target.classList.remove("editor-enter");
    void target.offsetWidth;
    target.classList.add("editor-enter");
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

    const isRich = mode === "richtext";
    document.getElementById("showFR").hidden = isRich;
    if (isRich) document.getElementById("find-replace").hidden = true;

    if (mode === "html") {
        html.srcdoc = textarea.value;
        if (html.contentDocument) {
            html.contentDocument.open();
            html.contentDocument.write(textarea.value || "");
            html.contentDocument.close();
        }
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
    clearTimeout(saveTimer);
    if (activeNoteId) {
        SaveCurrent();
    }
    const note = notes.find(n => n.id === id);
    if (!note) return;
    activeNoteId = note.id;
    tile = note.title || "Untitled";
    loadNoteIntoEditors(note);
    renderNotes();
    showActivity("Opened note: " + tile);
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
    document.getElementById("restore-note").addEventListener("click", restorePreviousVersion);
    document.getElementById("share-note").addEventListener("click", openSharePanel);
    document.getElementById("close-share").addEventListener("click", closeSharePanel);
    document.getElementById("generate-share-link").addEventListener("click", generateShareLink);
    document.getElementById("copy-share-link").addEventListener("click", copyShareLink);
    document.getElementById("send-share-email").addEventListener("click", sendShareEmail);


    const editorTypeSelect = document.getElementById("editor-type");
    // let previousMode = editorTypeSelect.value;
    editorTypeSelect.addEventListener("change", () => {
        const note = notes.find(n => n.id === activeNoteId);
        const select = document.getElementById("editor-type");
        if (!note) return;

        const newMode = editorTypeSelect.value;
        const oldMode = note.contentFormat || "text";
        
        const richToPlain = oldMode === "richtext" && (newMode === "text" || newMode==="markdown");
        if (richToPlain && !confirm("Formatting will be lost. Continue?")) {
            select.value = oldMode;
            return;
        }

        const oldContent = oldMode === "richtext"
            ? richEditor.getHTML()
            : document.getElementById("note-content").value;
        const nextContent = converText(oldContent, oldMode, newMode);

        saveVersion(note, note.title, oldContent, oldMode);

        note.content = nextContent;
        note.contentFormat = newMode;
        note.updatedAt = new Date().toISOString();
        localStorage.setItem("notepad-notes", JSON.stringify(notes));

        loadNoteIntoEditors(note);
        renderNotes();
        animateEditorChange();
        showActivity("Editor mode changed to " + newMode);
    });

    document.getElementById("note-content").addEventListener("input", addElements);
    document.getElementById("note-title").addEventListener("input", autoSave);
    document.getElementById("note-content").addEventListener("input", autoSave);
    document.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            SaveCurrent();
            showActivity("Note Saved!");
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
            event.preventDefault();
            document.getElementById("search-notes").focus();
            showActivity("Search Notes Focused!");
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
            event.preventDefault();
            CreateNote();
            showActivity("New Note Created!");
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
            event.preventDefault();
            exportNotes();
            showActivity("Note Exported!");
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
            event.preventDefault();
            deleteNote();
            showActivity("Note Deleted!");
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
            event.preventDefault();
            pinNote();
            showActivity("Note Pinned/Unpinned!");
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
            event.preventDefault();
            ToggleTheme();
            showActivity("Theme Changed!");
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "h") {
            event.preventDefault();
            document.getElementById("note-content").focus();
            showActivity("Note Content Focused!");
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "m") {
            event.preventDefault();
            document.getElementById("note-title").focus();
            showActivity("Note Title Focused!");
        }});
    document.getElementById("find-button").addEventListener("click", findText);
    document.getElementById("replace-button").addEventListener("click", replaceText);
    document.getElementById("replace-all-button").addEventListener("click", replaceAllText);
    document.getElementById("showFR").addEventListener('click', showFinder);
    document.getElementById("hideFR").addEventListener('click', hideFinder);
    document.getElementById("save-note").addEventListener("click", SaveCurrent);
    richEditor.on("update", () => {
        if (loadingDocument) return;
        const note = notes.find(n => n.id === activeNoteId); 
        if (!note || note.contentFormat !== 'richtext') return;
        updateDocumentStats();
        document.getElementById("save-status").textContent = "Not Saved";
        autoSave();
        showActivity("Rich Text Updated!");
    });
    connectRichToolbar();
    richEditor.on("selectionUpdate", refreshToolbarState);
    richEditor.on("update", refreshToolbarState);
    document.getElementById('fill-sample').addEventListener('click', fillSample);
}

function deleteNote() {
    if (!activeNoteId) return;
    const confirm = window.confirm("Are you sure you want to delete this note?");
    if (!confirm) return;
    const noteID = notes.find(n => n.id === activeNoteId);
    if (!noteID) return;

    notes = notes.filter(n => n.id !== activeNoteId);
    localStorage.setItem("notepad-notes", JSON.stringify(notes));
    activeNoteId = null;
    if (notes.length) {
        activeNoteId = notes[0].id;
        loadNoteIntoEditors(notes[0]);
    } else {
        loadingDocument=true;
        document.getElementById("note-title").value = "";
        document.getElementById("note-content").value = "";
        document.getElementById("editor-type").value = "text";
        richEditor.commands.clearContent();
        loadingDocument=false;
        addElements();
        updateDocumentStats();
        document.getElementById("save-status").textContent = "Deleted";
    }
    renderNotes();
    clearInterval(saveTimer);
    showActivity("Note Deleted!");
}

function pinNote() {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    note.pinned = !note.pinned;
    localStorage.setItem("notepad-notes", JSON.stringify(notes));
    renderNotes();
    showActivity(note.pinned ? "Note Pinned!" : "Note Unpinned!");
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
    showActivity("Note Exported!");
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000)
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
    const body = document.getElementById("page");
    body.style.backgroundColor = 'black';
    const title = document.getElementById("title")
    title.style.color = 'white';
    const newNote = document.getElementById("new-note");
    newNote.style.backgroundColor ='black';
    newNote.style.borderColor='white'
    newNote.style.color = 'white';
    const search = document.getElementById("search-notes")
    search.style.backgroundColor = "black";
    search.style.color = "white";
    const noteTitle = document.getElementById("note-title");
    noteTitle.style.backgroundColor = "black";
    noteTitle.style.marginBottom = "5px";
    noteTitle.style.borderColor ="green";
    const noteContent = document.getElementById("note-content");
    noteContent.style.backgroundColor="black";
    noteContent.style.color ="white";
    noteContent.style.marginBottom = "10px";
    const actions=document.querySelectorAll("#action button");
    actions.forEach(button => {
        button.style.borderColor="white";
    });

    const stats = document.getElementById("note-stats")
    stats.style.color ="white";

    const markdown = document.getElementById("markdown-preview");
    markdown.style.backgroundColor = "#1e293b";
    markdown.style.color = "#f8fafc";

    const html = document.getElementById("html-preview");
    html.style.backgroundColor = "#1e293b";
    html.style.color = "#f8fafc";
    html.style.borderColor = "#475569";

    const rich = document.getElementById("rich-text-editor .tiptap");
    if (rich) {
        rich.style.backgroundColor = "#1e293b";
        rich.style.color = "#f8fafc";
        rich.style.borderColor = "#475569";
    }
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
    const button = document.getElementById("theme-toggle");

    button.classList.remove("theme-spinning");
    void button.offsetWidth;
    button.classList.add("theme-spinning");

    themeIndex++;
    if (themeIndex > 4) {
        themeIndex = 0;
    }
    themes[themeIndex]();
    localStorage.setItem("themeIndex", themeIndex); 
    showActivity("Theme Changed to " + (themeIndex + 1) + "!");
}

let islandTimer;

function showActivity(message) {
    const button = document.getElementById("save-note");

    clearTimeout(islandTimer);

    button.classList.add("save-expanded");
    button.textContent = message;
    islandTimer = setTimeout(() => {
        button.classList.remove("save-expanded");
        button.textContent = "💾 Save";
    }, 1000); // will make it so that it shows for 1 second and then goes back to normal
}

let saveTimer;
function autoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        SaveCurrent();
    }, 3000)
    // change footer too 
    changeFooter();
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
    showActivity("Replaced first occurrence of text!");
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
    showActivity("Replaced all occurrences of text!");
}

function connectRichToolbar() {
    const actions = {
        "bold-button": () => richEditor.chain().focus().toggleBold().run(),
        "italic-button": () => richEditor.chain().focus().toggleItalic().run(),
        "strike-button": () => richEditor.chain().focus().toggleStrike().run(),
        "heading1": () => richEditor.chain().focus().toggleHeading({ level: 1 }).run(),
        "heading2": () => richEditor.chain().focus().toggleHeading({ level: 2 }).run(),
        "bulleted-list": () => richEditor.chain().focus().toggleBulletList().run(),
        "numbered-list": () => richEditor.chain().focus().toggleOrderedList().run(),
        "underline-button": () => richEditor.chain().focus().toggleUnderline().run(),
        "link-button": () => setEditorLink()
    };
    Object.entries(actions).forEach(([id, action]) => {
        document.getElementById(id).addEventListener("click", action);
    })
}

function loadNoteIntoEditors(note) {
    if (!note) return;
    document.getElementById("note-title").value = note.title;
    document.getElementById("editor-type").value = note.contentFormat || "text";
    loadingDocument = true;
    try {
        if (note.contentFormat === "richtext") {
            richEditor.commands.setContent(note.content || "<p></p>");
            document.getElementById("note-content").value = "";
        } else {
            document.getElementById("note-content").value = note.content || "";
            richEditor.commands.setContent("<p></p>");
        }
        addElements();
        updateDocumentStats();
        document.getElementById("save-status").textContent = "Saved";
    } finally {
        loadingDocument = false;
    }
}

function updateDocumentStats() {
    const mode = document.getElementById("editor-type").value;
    let text = mode === "richtext" ? richEditor.getText() : document.getElementById("note-content").value;

    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;

    document.getElementById("word-count").textContent = words + " words";
    document.getElementById("char-count").textContent = characters + " characters";
}

function fillSample() {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    const doc = document.getElementById("note-content");
    const confirm = window.confirm("All of the text will be erased and replaced by sample.");

    if (!confirm) return;

    const mode = note.contentFormat || "text";
    let placeholder;

    if (mode === "html") {
        placeholder = "<h1>HTML</h1><p>HTML preview works</p><ul><li>Steal the Moon</li><li>Make an arc Reactor</li><li>Make <strong>J.A.R.V.I.S</strong></li></ul>";
        doc.value = placeholder;
    };
    if (mode === "text") {
        placeholder = "Hi!\nThis a Notepad made by Srinivasa. It is smart and supports 4 formats('html', 'rich', 'markdown' and 'text').\n\nThanks for using this application.";
        doc.value = placeholder;
    } 
    if (mode === "markdown") {
        placeholder = "# Hello!\n\nMarkdown is supported and will work as a daily markdown editor." // will later replace this with actual readme of the notepad.  
        doc.value = placeholder;
    }
    if (mode === "richtext") {
        richEditor.commands.setContent("<h1>Example</h1><p>This is <strong>rich text</strong>.</p>");
    }
    addElements();
    updateDocumentStats();
    document.getElementById("save-status").textContent = "Not Saved";
    autoSave();
    showActivity("Sample Text Added!");
    animateSample();
}

function changeFooter() {
    const footer = document.getElementById("footer");
    // footer will be tips mostly (2-3 norm sentences)
    const tips = [
        "There are four themes(white, dark, fantasy & christmas).",
        "Made with love!",
        "Pin moves the note to the top of list.",
        "What you are reading are tips",
        "Pin important notes to the top.",
        "Use Cmd/Ctrl + S to save.",
        "Rich Text keeps formatting when saved."
    ]
    const index = Math.floor(Math.random() * tips.length);
    footer.textContent = tips[index];
}

function escapeHTML(text) {
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function plainTextFromHTML(html) {
    const holder = document.createElement("div");
    holder.innerHTML = DOMPurify.sanitize(html);
    return holder.textContent || "";
}

function converText(content, oldMode, newMode) {
    // this is like a feature but sometimes be not liked by user, later I will make it so that they can choose to turn this on or off
    //check the setting later

    if (oldMode === newMode) return content;

    if (newMode == "richtext") {
        if (oldMode === "markdown") {
            return DOMPurify.sanitize(marked.parse(content));
        }
        if (oldMode === 'html') {
            return DOMPurify.sanitize(content);
        }
        return "<p>" + escapeHTML(content).replace(/\n/g, "<br>") + "</p>";
    }
    if (newMode === "html" && oldMode === "markdown") {
        return DOMPurify.sanitize(marked.parse(content));
    }
    if (oldMode === "html") return plainTextFromHTML(content);
    if (oldMode === "richtext") {
        return newMode === "html" ? content : plainTextFromHTML(content)
    }
    if (oldMode === "markdown") return content;
    return content;
}

function setEditorLink() {
    const existing = richEditor.getAttributes("link").href || "";
    const raw = prompt("Enter an HTTPS or HTTP URL",existing);
    if (raw === null) return;
    if (!raw.trim()) {
        richEditor.chain().focus().unsetLink().run();
        return;
    }
    try {
        const parsed = new URL(raw.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
            alert("Only http:// and https:// links are supported. ");
            return;
        }
        richEditor.chain().focus().extendMarkRange("link").setLink({href: parsed.href}).run();
    } catch {
        alert("Enter a valid URL.");
    }
}

function refreshToolbarState() {
    const states = {
        "bold-button": richEditor.isActive("bold"),
        "italic-button": richEditor.isActive("italic"),
        "underline-button": richEditor.isActive("underline"),
        "heading1": richEditor.isActive("heading", {level:1}),
        "heading2": richEditor.isActive("heading", {level:2})
    };
    Object.entries(states).forEach(([id, active]) => {
        document.getElementById(id).classList.toggle("active-tool", active);
    });
}

function getHistory(noteId) {
    try {
        return JSON.parse(localStorage.getItem("history:" + noteId) || "[]");
    } catch {
        return [];
    }
}

function rememberVersion(note) {
    const history = getHistory(note.id);
    const last = history[history.length - 1];
    if (last && last.content === note.content && last.title === note.title) return;
    history.push({
        title: note.title,
        content: note.content,
        mode: note.contentFormat || "text",
        savedAt: new Date().toISOString()
    });
    localStorage.setItem("history:" + note.id, JSON.stringify(history.slice(-10)));
}

function saveVersion(note, oldTitle, oldContent, oldMode) {
   rememberVersion({
        id: note.id,
        title: oldTitle,
        content: oldContent,
        contentFormat: oldMode
    });
    note.revision = (note.revision || 0) +1
    }

function restorePreviousVersion() {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) {return;}
    const history = getHistory(note.id);
    if (!history.length) return alert("No previous versions.");
    const old = history[history.length - 1];
    if (!confirm("Restore previous version from " + old.savedAt + "?")) return;
    clearTimeout(saveTimer);
    history.pop()
    rememberVersion(note);
    localStorage.setItem("history:" + note.id, JSON.stringify(history));
    note.title = old.title;
    note.content = old.content;
    note.contentFormat = old.mode;
    note.revision = (note.revision || 0) + 1;
    localStorage.setItem("notepad-notes", JSON.stringify(notes));
    loadNoteIntoEditors(note);
    renderNotes();
    document.getElementById("save-status").textContent = "Restored";
    showActivity("Restored previous version!");
}

function animateSample() {
    const mode = document.getElementById("editor-type").value;

    const target = mode === "richtext" ? document.getElementById("rich-text-content") : document.getElementById("note-content");
    if (!target) return;
    target.classList.remove("sample-animation");
    void target.offsetWidth;
    target.classList.add("sample-animation");
}

function openSharePanel() {
    document.getElementById("share-panel").hidden = false;
    showActivity("Sharing options opened");
}

function closeSharePanel() {
    document.getElementById("share-panel").hidden = true;
}

let currentShareLink;
function generateShareLink() {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return alert("No note selected to share.");
    const permission = document.getElementById("share-permission").value;

    const data = {
        title: document.getElementById("note-title").value,
        content:note.contentFormat === "richtext" ? richEditor.getHTML() : document.getElementById("note-content").value,
        mode: note.contentFormat || "text",
        format: note.contentFormat, 
        permission
    };
    const encoded = encodeURIComponent(JSON.stringify(data));

    currentShareLink = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    document.getElementById("share-link").value = currentShareLink;
    document.getElementById("copy-share-link").disabled = false;
    showActivity("Share link generated!");
}

async function copyShareLink() {
    if(!currentShareLink) return;

    try {
        await navigator.clipboard.writeText(currentShareLink);
        showActivity("Link copied!");
    } catch (err) {
        alert("Failed to copy link: " + err);
        showActivity("Failed to copy link.");
    }
}


function sendShareEmail() {
    const email = document.getElementById("share-email").value.trim();

    if (!email) {
        alert("Please enter an email address.");
        return;
    }

    const emailInput = document.getElementById("share-email");

    if (!emailInput.checkValidity()) {
        alert("Please enter a valid email address.");
        return;
    }

    if (!currentShareLink) {
        alert("Please generate a share link first.");
        return;
    }

    const subject = "NOTEPAD - Shared Note Invitation";
    const body = `Hello! 
    I've shared a note with you using NOTEPAD.

    Open the note here:
    ${currentShareLink}

    See you there!`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; // used ai to help on this

    window.open(gmailUrl, "_blank", "noopener,noreferrer");
    showActivity("Gmail invitation opened!");
}

// plan: after all the app is done, I will add ai (for correcting spell errros, autofill, predict next and will think more abiout this)

allListeners();
