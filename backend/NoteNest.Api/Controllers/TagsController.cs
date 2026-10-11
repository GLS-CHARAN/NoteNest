using Microsoft.AspNetCore.Mvc;
using NoteNest.Api.Data;
using NoteNest.Api.Dtos;

namespace NoteNest.Api.Controllers;

[Route("api/tags")]
public class TagsController : ApiControllerBase
{
    private readonly JsonDb _db;
    public TagsController(JsonDb db) => _db = db;

    [HttpGet]
    public List<TagDto> List()
    {
        var uid = UserId;
        return _db.Read(d => d.Tags.Where(t => t.UserId == uid)
            .OrderBy(t => t.Name, StringComparer.OrdinalIgnoreCase).Select(t => new TagDto(t.Id, t.Name)).ToList());
    }
}
