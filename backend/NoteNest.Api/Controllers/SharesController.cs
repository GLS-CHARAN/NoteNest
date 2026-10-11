using Microsoft.AspNetCore.Mvc;
using NoteNest.Api.Data;
using NoteNest.Api.Dtos;
using NoteNest.Api.Models;
using NoteNest.Api.Services;

namespace NoteNest.Api.Controllers;

[Route("api/notes/{noteId:int}/shares")]
public class SharesController : ApiControllerBase
{
    private readonly JsonDb _db;
    public SharesController(JsonDb db) => _db = db;

    [HttpGet]
    public ActionResult<List<ShareDto>> List(int noteId)
    {
        var uid = UserId;
        return Respond(_db.Read(d =>
        {
            if (NoteAccess.GetRole(d, noteId, uid) != NoteRole.Owner) return Outcome<List<ShareDto>>.Fail(404);
            return Outcome<List<ShareDto>>.Success(d.NoteShares.Where(s => s.NoteId == noteId)
                .OrderBy(s => s.CreatedAtUtc).Select(s => Mapping.ToShareDto(d, s)).ToList());
        }));
    }

    [HttpPost]
    public ActionResult<ShareDto> Create(int noteId, ShareCreateDto dto)
    {
        var uid = UserId;
        var email = dto.Email.Trim().ToLowerInvariant();
        return Respond(_db.Write(d =>
        {
            if (NoteAccess.GetRole(d, noteId, uid) != NoteRole.Owner) return Outcome<ShareDto>.Fail(404);

            var target = d.Users.FirstOrDefault(u => u.Email == email);
            if (target is null) return Outcome<ShareDto>.Fail(404, "No NoteNest user has that email address.");
            if (target.Id == uid) return Outcome<ShareDto>.Fail(400, "This note is already yours.");

            var share = d.NoteShares.FirstOrDefault(s => s.NoteId == noteId && s.SharedWithUserId == target.Id);
            if (share is not null)
            {
                share.Permission = dto.Permission;
                return Outcome<ShareDto>.Success(Mapping.ToShareDto(d, share));
            }
            share = new NoteShare
            {
                Id = d.NextShareId++, NoteId = noteId, SharedWithUserId = target.Id,
                Permission = dto.Permission, CreatedAtUtc = DateTime.UtcNow
            };
            d.NoteShares.Add(share);
            return Outcome<ShareDto>.Success(Mapping.ToShareDto(d, share), 201);
        }));
    }

    [HttpDelete("{shareId:int}")]
    public IActionResult Revoke(int noteId, int shareId)
    {
        var uid = UserId;
        var outcome = _db.Write(d =>
        {
            if (NoteAccess.GetRole(d, noteId, uid) != NoteRole.Owner) return Outcome<bool>.Fail(404);
            return d.NoteShares.RemoveAll(s => s.Id == shareId && s.NoteId == noteId) == 0
                ? Outcome<bool>.Fail(404) : Outcome<bool>.Success(true, 204);
        });
        return outcome.Ok ? NoContent() : Failure(outcome);
    }
}
