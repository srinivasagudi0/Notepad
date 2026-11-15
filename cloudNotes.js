import { supabase } from "./supabase.js";

export async function loadCloudNotes() {
    const { data, error } = await supabase
        .from("notes")
        .select("*, note_collaborators(role)")
        .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function saveCloudNotes(note) {
    const { data: { user }, error: authError } =
        await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Not logged in");
    }

    const { data, error } = await supabase
        .from("notes")
        .insert({
            id: note.id,
            owner_id: user.id,
            title: note.title,
            content: note.content,
            content_format: note.contentFormat,
            revision: note.revision || 0
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteCloudNote(cloudId) {
    const { error } = await supabase.from("notes").delete().eq("id", cloudId);
    if (error) throw error;
}

export async function inviteCollaborator(noteId, email, role) {
    const { data, error } = await supabase.rpc("invite_note_collaborator", {
        p_note_id: noteId, p_email: email, p_role: role
    });
    if (error) throw error;
    return data;
}

export async function updateCloudNotes(cloudId, note) {
    const { data, error } = await supabase
        .from("notes")
        .update({
            title: note.title,
            content: note.content,
            content_format: note.contentFormat
        })
        .eq("id", cloudId)
        .eq("revision", note.revision || 0)
        .select()
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        throw new Error(
            "Save conflict or permission denied. Reload before editing."
        );
    }

    return data;
}
