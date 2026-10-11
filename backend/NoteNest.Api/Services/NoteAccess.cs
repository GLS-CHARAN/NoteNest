using NoteNest.Api.Data;
using NoteNest.Api.Models;

namespace NoteNest.Api.Services;

public enum NoteRole { None = 0, Viewer = 1, Editor = 2, Owner = 3 }

/// The single place that decides who may do what with a note. Call it inside Read/Write.
public static class NoteAccess
{
    public static NoteRole GetRole(DbData d, int noteId, string userId)
    {
        var note = d.Notes.FirstOrDefault(n => n.Id == noteId);
        if (note is null) return NoteRole.None;
        if (note.OwnerId == userId) return NoteRole.Owner;

        var share = d.NoteShares.FirstOrDefault(s => s.NoteId == noteId && s.SharedWithUserId == userId);
        if (share is null) return NoteRole.None;
        return share.Permission == SharePermission.Editor ? NoteRole.Editor : NoteRole.Viewer;
    }
}
