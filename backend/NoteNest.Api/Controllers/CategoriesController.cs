using Microsoft.AspNetCore.Mvc;
using NoteNest.Api.Data;
using NoteNest.Api.Dtos;
using NoteNest.Api.Models;
using NoteNest.Api.Services;

namespace NoteNest.Api.Controllers;

[Route("api/categories")]
public class CategoriesController : ApiControllerBase
{
    private readonly JsonDb _db;
    public CategoriesController(JsonDb db) => _db = db;

    [HttpGet]
    public List<CategoryDto> List()
    {
        var uid = UserId;
        return _db.Read(d => d.Categories.Where(c => c.UserId == uid)
            .OrderBy(c => c.Name, StringComparer.OrdinalIgnoreCase).Select(c => new CategoryDto(c.Id, c.Name)).ToList());
    }

    [HttpPost]
    public ActionResult<CategoryDto> Create(CategorySaveDto dto)
    {
        var uid = UserId;
        var name = dto.Name.Trim();
        return Respond(_db.Write(d =>
        {
            if (d.Categories.Any(c => c.UserId == uid && c.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
                return Outcome<CategoryDto>.Fail(409, "You already have a category with that name.");
            var c = new Category { Id = d.NextCategoryId++, UserId = uid, Name = name, CreatedAtUtc = DateTime.UtcNow };
            d.Categories.Add(c);
            return Outcome<CategoryDto>.Success(new CategoryDto(c.Id, c.Name), 201);
        }));
    }

    [HttpPut("{id:int}")]
    public ActionResult<CategoryDto> Rename(int id, CategorySaveDto dto)
    {
        var uid = UserId;
        var name = dto.Name.Trim();
        return Respond(_db.Write(d =>
        {
            var c = d.Categories.FirstOrDefault(x => x.Id == id && x.UserId == uid);
            if (c is null) return Outcome<CategoryDto>.Fail(404);
            if (d.Categories.Any(x => x.UserId == uid && x.Id != id && x.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
                return Outcome<CategoryDto>.Fail(409, "You already have a category with that name.");
            c.Name = name;
            return Outcome<CategoryDto>.Success(new CategoryDto(c.Id, c.Name));
        }));
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var uid = UserId;
        var outcome = _db.Write(d =>
        {
            if (d.Categories.RemoveAll(c => c.Id == id && c.UserId == uid) == 0) return Outcome<bool>.Fail(404);
            foreach (var n in d.Notes.Where(n => n.CategoryId == id)) n.CategoryId = null;   // notes stay, uncategorised
            return Outcome<bool>.Success(true, 204);
        });
        return outcome.Ok ? NoContent() : Failure(outcome);
    }
}
