using NoteNest.Api.Data;
using NoteNest.Api.Dtos;
using NoteNest.Api.Models;

namespace NoteNest.Api.Services;

public static class Mapping
{
    public static ShareDto ToShareDto(DbData d, NoteShare s)
    {
        var u = d.Users.First(x => x.Id == s.SharedWithUserId);
        return new ShareDto(s.Id, u.Id, u.Email, u.DisplayName, s.Permission.ToString(), s.CreatedAtUtc);
    }

    public static AttachmentDto ToAttachmentDto(NoteAttachment a) =>
        new(a.Id, a.FileName, a.ContentType, a.FileSize, a.MediaType.ToString(), $"/api/notes/{a.NoteId}/attachments/{a.Id}");

    public static NoteDetailDto BuildDetail(DbData d, Note n, NoteRole role)
    {
        var owner = d.Users.FirstOrDefault(u => u.Id == n.OwnerId)?.DisplayName ?? "";
        var category = n.CategoryId.HasValue ? d.Categories.FirstOrDefault(c => c.Id == n.CategoryId)?.Name : null;

        var attachments = d.Attachments.Where(a => a.NoteId == n.Id)
            .OrderBy(a => a.SortOrder).ThenBy(a => a.Id).Select(ToAttachmentDto).ToList();

        var tags = d.NoteTags.Where(nt => nt.NoteId == n.Id)
            .Select(nt => d.Tags.First(t => t.Id == nt.TagId))
            .Select(t => new TagDto(t.Id, t.Name)).OrderBy(t => t.Name).ToList();

        var shares = role == NoteRole.Owner
            ? d.NoteShares.Where(s => s.NoteId == n.Id).OrderBy(s => s.CreatedAtUtc).Select(s => ToShareDto(d, s)).ToList()
            : null;

        return new NoteDetailDto(n.Id, n.Title, n.Content, n.CategoryId, category, tags, n.IsPinned,
            n.CreatedAtUtc, n.UpdatedAtUtc, owner, role.ToString(), attachments, shares);
    }
}
