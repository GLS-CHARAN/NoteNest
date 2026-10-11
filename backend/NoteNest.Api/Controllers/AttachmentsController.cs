using Microsoft.AspNetCore.Mvc;
using NoteNest.Api.Data;
using NoteNest.Api.Dtos;
using NoteNest.Api.Models;
using NoteNest.Api.Services;

namespace NoteNest.Api.Controllers;

[Route("api/notes/{noteId:int}/attachments")]
public class AttachmentsController : ApiControllerBase
{
    private const long MaxRequestBytes = 314_572_800; // 300 MB per request
    private readonly JsonDb _db;
    private readonly IMediaStorage _storage;
    private readonly IConfiguration _cfg;

    public AttachmentsController(JsonDb db, IMediaStorage storage, IConfiguration cfg)
    { _db = db; _storage = storage; _cfg = cfg; }

    private record Saved(string Key, string DisplayName, MediaCheck Check, long Size);
    private record FileRef(string Key, string ContentType);

    [HttpPost]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<ActionResult<List<AttachmentDto>>> Upload(int noteId, [FromForm] List<IFormFile> files)
    {
        var uid = UserId;
        if (files.Count == 0) return BadRequest(new { message = "No files were sent." });

        var maxImg = _cfg.GetValue<long>("MediaStorage:MaxImageBytes");
        var maxVid = _cfg.GetValue<long>("MediaStorage:MaxVideoBytes");
        var maxFiles = _cfg.GetValue<int>("MediaStorage:MaxFilesPerNote");

        // 1) may this user add files here?
        var pre = _db.Read(d =>
        {
            var role = NoteAccess.GetRole(d, noteId, uid);
            if (role == NoteRole.None) return Outcome<int>.Fail(404);
            if (role < NoteRole.Editor) return Outcome<int>.Fail(403, "You have view-only access to this note.");
            return Outcome<int>.Success(d.Attachments.Count(a => a.NoteId == noteId));
        });
        if (!pre.Ok) return Failure(pre);
        if (pre.Value + files.Count > maxFiles)
            return BadRequest(new { message = $"A note can have at most {maxFiles} attachments." });

        // 2) validate every file first (extension, content type, size, real header bytes)
        var checks = new List<(IFormFile file, MediaCheck check)>();
        var errors = new List<string>();
        foreach (var f in files)
        {
            var header = new byte[16];
            await using (var s = f.OpenReadStream()) { _ = await s.ReadAsync(header.AsMemory(0, 16)); }
            var check = MediaValidator.Validate(f.FileName, f.ContentType, f.Length, header, maxImg, maxVid);
            if (!check.Ok) errors.Add(check.Error!); else checks.Add((f, check));
        }
        if (errors.Count > 0) return BadRequest(new { message = string.Join(" ", errors), errors });

        // 3) save the bytes with generated names, then the metadata into json.db
        var saved = new List<Saved>();
        try
        {
            foreach (var (file, check) in checks)
            {
                var key = $"{noteId}/{Guid.NewGuid():N}{check.Extension}";
                await using (var s = file.OpenReadStream()) await _storage.SaveAsync(key, s);
                var display = Path.GetFileName(file.FileName);
                if (display.Length > 260) display = display[^260..];
                saved.Add(new Saved(key, display, check, file.Length));
            }

            var outcome = _db.Write(d =>
            {
                var role = NoteAccess.GetRole(d, noteId, uid);   // re-check: the note may have changed meanwhile
                if (role < NoteRole.Editor) return Outcome<List<AttachmentDto>>.Fail(role == NoteRole.None ? 404 : 403);
                var next = d.Attachments.Where(a => a.NoteId == noteId).Select(a => a.SortOrder).DefaultIfEmpty(0).Max() + 1;
                var created = new List<AttachmentDto>();
                foreach (var s in saved)
                {
                    var a = new NoteAttachment
                    {
                        Id = d.NextAttachmentId++, NoteId = noteId, FileName = s.DisplayName, StorageKey = s.Key,
                        ContentType = s.Check.ContentType, FileSize = s.Size, MediaType = s.Check.MediaType,
                        SortOrder = next++, CreatedAtUtc = DateTime.UtcNow
                    };
                    d.Attachments.Add(a);
                    created.Add(Mapping.ToAttachmentDto(a));
                }
                d.Notes.First(n => n.Id == noteId).UpdatedAtUtc = DateTime.UtcNow;
                return Outcome<List<AttachmentDto>>.Success(created, 201);
            });

            if (!outcome.Ok) { foreach (var s in saved) await _storage.DeleteAsync(s.Key); return Failure(outcome); }
            return Respond(outcome);
        }
        catch
        {
            foreach (var s in saved) await _storage.DeleteAsync(s.Key);   // never leave orphan files
            throw;
        }
    }

    // Authorised streaming: media is never served from a public folder.
    [HttpGet("{attachmentId:int}")]
    public IActionResult Download(int noteId, int attachmentId)
    {
        var uid = UserId;
        var file = _db.Read(d =>
        {
            if (NoteAccess.GetRole(d, noteId, uid) == NoteRole.None) return (FileRef?)null;
            return d.Attachments.Where(a => a.Id == attachmentId && a.NoteId == noteId)
                .Select(a => new FileRef(a.StorageKey, a.ContentType)).FirstOrDefault();
        });
        if (file is null || !_storage.Exists(file.Key)) return NotFound();

        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Cache-Control"] = "private, max-age=3600";
        return File(_storage.OpenRead(file.Key), file.ContentType, enableRangeProcessing: true);   // range = video seeking
    }

    [HttpDelete("{attachmentId:int}")]
    public async Task<IActionResult> Delete(int noteId, int attachmentId)
    {
        var uid = UserId;
        var outcome = _db.Write(d =>
        {
            var role = NoteAccess.GetRole(d, noteId, uid);
            if (role == NoteRole.None) return Outcome<string>.Fail(404);
            if (role < NoteRole.Editor) return Outcome<string>.Fail(403, "You have view-only access to this note.");
            var a = d.Attachments.FirstOrDefault(x => x.Id == attachmentId && x.NoteId == noteId);
            if (a is null) return Outcome<string>.Fail(404);
            d.Attachments.Remove(a);
            d.Notes.First(n => n.Id == noteId).UpdatedAtUtc = DateTime.UtcNow;
            return Outcome<string>.Success(a.StorageKey, 204);
        });
        if (!outcome.Ok) return Failure(outcome);
        await _storage.DeleteAsync(outcome.Value!);
        return NoContent();
    }
}
