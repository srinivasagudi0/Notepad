import { supabase } from "./supabase.js";

export async function loadCloudNotes() {
    const { data, error } = await supabase
        .from("notes")
        .select("*")
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
            owner_id: user.id,
            title: note.title,
            content: note.content,
            content_format: note.contentFormat
        })
        .select()
        .single();

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
        .eq("revision", note.cloudRevision)
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
