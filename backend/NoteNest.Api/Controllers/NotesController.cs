using Microsoft.AspNetCore.Mvc;
using NoteNest.Api.Data;
using NoteNest.Api.Dtos;
using NoteNest.Api.Models;
using NoteNest.Api.Services;

namespace NoteNest.Api.Controllers;

public class NoteQuery
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public string? Tag { get; set; }
    public bool? HasImages { get; set; }
    public bool? HasVideos { get; set; }
    public bool? Pinned { get; set; }
    public string? Sort { get; set; }   // updated | created | title
    public string? Dir { get; set; }    // asc | desc
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

[Route("api/notes")]
public class NotesController : ApiControllerBase
{
    private readonly JsonDb _db;
    private readonly IMediaStorage _storage;
    public NotesController(JsonDb db, IMediaStorage storage) { _db = db; _storage = storage; }

    // ---------- list ----------
    [HttpGet]
    public PagedResult<NoteSummaryDto> List([FromQuery] NoteQuery q) => RunQuery(q, shared: false);

    [HttpGet("shared-with-me")]
    public PagedResult<NoteSummaryDto> SharedWithMe([FromQuery] NoteQuery q) => RunQuery(q, shared: true);

    private PagedResult<NoteSummaryDto> RunQuery(NoteQuery q, bool shared)
    {
        var uid = UserId;
        return _db.Read(d =>
        {
            var myShares = d.NoteShares.Where(s => s.SharedWithUserId == uid).ToDictionary(s => s.NoteId, s => s.Permission);
            var shareCount = d.NoteShares.GroupBy(s => s.NoteId).ToDictionary(g => g.Key, g => g.Count());
            var attachments = d.Attachments.ToLookup(a => a.NoteId);
            var tagName = d.Tags.ToDictionary(t => t.Id, t => t.Name);
            var tagsByNote = d.NoteTags.ToLookup(nt => nt.NoteId, nt => tagName[nt.TagId]);
            var categories = d.Categories.ToDictionary(c => c.Id, c => c.Name);
            var users = d.Users.ToDictionary(u => u.Id, u => u.DisplayName);

            IEnumerable<Note> notes = shared
                ? d.Notes.Where(n => myShares.ContainsKey(n.Id))
                : d.Notes.Where(n => n.OwnerId == uid);

            if (!string.IsNullOrWhiteSpace(q.Search))
            {
                var s = q.Search.Trim();
                notes = notes.Where(n => n.Title.Contains(s, StringComparison.OrdinalIgnoreCase)
                                      || n.Content.Contains(s, StringComparison.OrdinalIgnoreCase));
            }
            if (q.CategoryId.HasValue) notes = notes.Where(n => n.CategoryId == q.CategoryId);
            if (!string.IsNullOrWhiteSpace(q.Tag))
            {
                var t = q.Tag.Trim().ToLowerInvariant();
                notes = notes.Where(n => tagsByNote[n.Id].Contains(t));
            }
            if (q.HasImages == true) notes = notes.Where(n => attachments[n.Id].Any(a => a.MediaType == MediaType.Image));
            if (q.HasVideos == true) notes = notes.Where(n => attachments[n.Id].Any(a => a.MediaType == MediaType.Video));
            if (q.Pinned == true) notes = notes.Where(n => n.IsPinned);

            var sort = (q.Sort ?? "updated").ToLowerInvariant();
            var desc = q.Dir is null ? sort != "title" : q.Dir.Equals("desc", StringComparison.OrdinalIgnoreCase);
            notes = sort switch
            {
                "title" => desc ? notes.OrderByDescending(n => n.Title, StringComparer.OrdinalIgnoreCase).ThenBy(n => n.Id)
                                : notes.OrderBy(n => n.Title, StringComparer.OrdinalIgnoreCase).ThenBy(n => n.Id),
                "created" => desc ? notes.OrderByDescending(n => n.CreatedAtUtc).ThenBy(n => n.Id)
                                  : notes.OrderBy(n => n.CreatedAtUtc).ThenBy(n => n.Id),
                _ => desc ? notes.OrderByDescending(n => n.UpdatedAtUtc).ThenBy(n => n.Id)
                          : notes.OrderBy(n => n.UpdatedAtUtc).ThenBy(n => n.Id),
            };

            var all = notes.ToList();
            var pageSize = Math.Clamp(q.PageSize, 1, 50);
            var page = Math.Max(q.Page, 1);

            var items = all.Skip((page - 1) * pageSize).Take(pageSize).Select(n =>
            {
                var atts = attachments[n.Id].ToList();
                var thumb = atts.Where(a => a.MediaType == MediaType.Image).OrderBy(a => a.SortOrder).ThenBy(a => a.Id)
                    .Select(a => (int?)a.Id).FirstOrDefault();
                var role = n.OwnerId == uid ? "Owner" : (myShares.GetValueOrDefault(n.Id) == SharePermission.Editor ? "Editor" : "Viewer");
                return new NoteSummaryDto(
                    n.Id, n.Title, n.Content.Length > 160 ? n.Content.Substring(0, 160) : n.Content,
                    n.CategoryId, n.CategoryId.HasValue ? categories.GetValueOrDefault(n.CategoryId.Value) : null,
                    tagsByNote[n.Id].OrderBy(x => x).ToList(), n.IsPinned, n.CreatedAtUtc, n.UpdatedAtUtc,
                    thumb, atts.Any(a => a.MediaType == MediaType.Image), atts.Any(a => a.MediaType == MediaType.Video),
                    n.OwnerId != uid || shareCount.ContainsKey(n.Id), users.GetValueOrDefault(n.OwnerId) ?? "", role);
            }).ToList();

            return new PagedResult<NoteSummaryDto>(items, page, pageSize, all.Count);
        });
    }

    // ---------- detail ----------
    [HttpGet("{id:int}")]
    public ActionResult<NoteDetailDto> Get(int id)
    {
        var uid = UserId;
        return Respond(_db.Read(d =>
        {
            var role = NoteAccess.GetRole(d, id, uid);
            if (role == NoteRole.None) return Outcome<NoteDetailDto>.Fail(404);   // same answer for "missing" and "not yours"
            return Outcome<NoteDetailDto>.Success(Mapping.BuildDetail(d, d.Notes.First(n => n.Id == id), role));
        }));
    }

    // ---------- create ----------
    [HttpPost]
    public ActionResult<NoteDetailDto> Create(NoteSaveDto dto)
    {
        var uid = UserId;
        var (names, tagError) = NormalizeTags(dto.Tags);
        if (tagError is not null) return BadRequest(new { message = tagError });

        return Respond(_db.Write(d =>
        {
            if (dto.CategoryId is int cid && !d.Categories.Any(c => c.Id == cid && c.UserId == uid))
                return Outcome<NoteDetailDto>.Fail(400, "Category not found.");
            var now = DateTime.UtcNow;
            var note = new Note
            {
                Id = d.NextNoteId++, OwnerId = uid, Title = dto.Title.Trim(), Content = dto.Content ?? "",
                CategoryId = dto.CategoryId, IsPinned = dto.IsPinned, CreatedAtUtc = now, UpdatedAtUtc = now
            };
            d.Notes.Add(note);
            ApplyTags(d, note.Id, names, uid);
            return Outcome<NoteDetailDto>.Success(Mapping.BuildDetail(d, note, NoteRole.Owner), 201);
        }));
    }

    // ---------- update ----------
    [HttpPut("{id:int}")]
    public ActionResult<NoteDetailDto> Update(int id, NoteSaveDto dto)
    {
        var uid = UserId;
        var (names, tagError) = NormalizeTags(dto.Tags);

        return Respond(_db.Write(d =>
        {
            var role = NoteAccess.GetRole(d, id, uid);
            if (role == NoteRole.None) return Outcome<NoteDetailDto>.Fail(404);
            if (role < NoteRole.Editor) return Outcome<NoteDetailDto>.Fail(403, "You have view-only access to this note.");

            if (role == NoteRole.Owner)   // editors may change text only
            {
                if (tagError is not null) return Outcome<NoteDetailDto>.Fail(400, tagError);
                if (dto.CategoryId is int cid && !d.Categories.Any(c => c.Id == cid && c.UserId == uid))
                    return Outcome<NoteDetailDto>.Fail(400, "Category not found.");
            }

            var note = d.Notes.First(n => n.Id == id);
            note.Title = dto.Title.Trim();
            note.Content = dto.Content ?? "";
            if (role == NoteRole.Owner)
            {
                note.CategoryId = dto.CategoryId;
                note.IsPinned = dto.IsPinned;
                var wanted = names.ToHashSet();
                var tagName = d.Tags.ToDictionary(t => t.Id, t => t.Name);
                d.NoteTags.RemoveAll(nt => nt.NoteId == id && !wanted.Contains(tagName[nt.TagId]));
                ApplyTags(d, id, names, uid);
            }
            note.UpdatedAtUtc = DateTime.UtcNow;
            return Outcome<NoteDetailDto>.Success(Mapping.BuildDetail(d, note, role));
        }));
    }

    [HttpPatch("{id:int}/pin")]
    public ActionResult<NoteDetailDto> Pin(int id, PinDto dto)
    {
        var uid = UserId;
        return Respond(_db.Write(d =>
        {
            var role = NoteAccess.GetRole(d, id, uid);
            if (role == NoteRole.None) return Outcome<NoteDetailDto>.Fail(404);
            if (role != NoteRole.Owner) return Outcome<NoteDetailDto>.Fail(403, "Only the owner can pin this note.");
            var note = d.Notes.First(n => n.Id == id);
            note.IsPinned = dto.IsPinned;   // pinning does not change "last updated"
            return Outcome<NoteDetailDto>.Success(Mapping.BuildDetail(d, note, role));
        }));
    }

    // ---------- tags on a note ----------
    [HttpPost("{id:int}/tags")]
    public ActionResult<NoteDetailDto> AddTag(int id, TagNameDto dto)
    {
        var uid = UserId;
        var (names, err) = NormalizeTags(new List<string> { dto.Name });
        if (err is not null || names.Count == 0) return BadRequest(new { message = err ?? "Tag is empty." });

        return Respond(_db.Write(d =>
        {
            var role = NoteAccess.GetRole(d, id, uid);
            if (role == NoteRole.None) return Outcome<NoteDetailDto>.Fail(404);
            if (role != NoteRole.Owner) return Outcome<NoteDetailDto>.Fail(403, "Only the owner can change tags.");
            if (d.NoteTags.Count(nt => nt.NoteId == id) >= 10)
                return Outcome<NoteDetailDto>.Fail(400, "A note can have at most 10 tags.");
            ApplyTags(d, id, names, uid);
            return Outcome<NoteDetailDto>.Success(Mapping.BuildDetail(d, d.Notes.First(n => n.Id == id), role));
        }));
    }

    [HttpDelete("{id:int}/tags/{tagId:int}")]
    public ActionResult<NoteDetailDto> RemoveTag(int id, int tagId)
    {
        var uid = UserId;
        return Respond(_db.Write(d =>
        {
            var role = NoteAccess.GetRole(d, id, uid);
            if (role == NoteRole.None) return Outcome<NoteDetailDto>.Fail(404);
            if (role != NoteRole.Owner) return Outcome<NoteDetailDto>.Fail(403, "Only the owner can change tags.");
            d.NoteTags.RemoveAll(nt => nt.NoteId == id && nt.TagId == tagId);
            return Outcome<NoteDetailDto>.Success(Mapping.BuildDetail(d, d.Notes.First(n => n.Id == id), role));
        }));
    }

    // ---------- delete ----------
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var uid = UserId;
        var outcome = _db.Write(d =>
        {
            var role = NoteAccess.GetRole(d, id, uid);
            if (role == NoteRole.None) return Outcome<List<string>>.Fail(404);
            if (role != NoteRole.Owner) return Outcome<List<string>>.Fail(403, "Only the owner can delete this note.");
            var keys = d.Attachments.Where(a => a.NoteId == id).Select(a => a.StorageKey).ToList();
            d.Attachments.RemoveAll(a => a.NoteId == id);
            d.NoteTags.RemoveAll(nt => nt.NoteId == id);
            d.NoteShares.RemoveAll(s => s.NoteId == id);
            d.Notes.RemoveAll(n => n.Id == id);
            return Outcome<List<string>>.Success(keys, 204);
        });
        if (!outcome.Ok) return Failure(outcome);
        foreach (var key in outcome.Value!) await _storage.DeleteAsync(key);   // files go after the data is saved
        return NoContent();
    }

    // ---------- helpers ----------
    private static (List<string> names, string? error) NormalizeTags(List<string>? raw)
    {
        var names = (raw ?? new()).Select(t => t.Trim().ToLowerInvariant()).Where(t => t.Length > 0).Distinct().ToList();
        if (names.Count > 10) return (names, "A note can have at most 10 tags.");
        if (names.Any(t => t.Length > 30)) return (names, "Tags can be at most 30 characters.");
        return (names, null);
    }

    private static void ApplyTags(DbData d, int noteId, List<string> names, string uid)
    {
        foreach (var name in names)
        {
            var tag = d.Tags.FirstOrDefault(t => t.UserId == uid && t.Name == name);
            if (tag is null) { tag = new Tag { Id = d.NextTagId++, UserId = uid, Name = name }; d.Tags.Add(tag); }
            if (!d.NoteTags.Any(nt => nt.NoteId == noteId && nt.TagId == tag.Id))
                d.NoteTags.Add(new NoteTag { NoteId = noteId, TagId = tag.Id });
        }
    }
}
