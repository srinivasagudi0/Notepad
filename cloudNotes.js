import { supabase } from "./supabase.js";

export async function saveCloudNotes(note) {
    const { data: {user}, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("User not authenticated:", authError);
        return;
    }

    const { data, error } = await supabase.from('notes').insert({
        owner_id: user.id,
        title: note.title,
        content: note.content,
        content_format: note.contentFormat,
    }).select().single();

    if (error) {
        throw error;
    }
    return data;
}

export async function getCloudNotes() {
    //pass
}