using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NoteNest.Api.Services;

namespace NoteNest.Api.Controllers;

[ApiController]
[Authorize]
public abstract class ApiControllerBase : ControllerBase
{
    /// The user id always comes from the signed auth cookie, never from the request body.
    protected string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    protected ActionResult Failure<T>(Outcome<T> o) =>
        o.Message is null ? StatusCode(o.Status) : StatusCode(o.Status, new { message = o.Message });

    protected ActionResult<T> Respond<T>(Outcome<T> o) =>
        o.Ok ? StatusCode(o.Status, o.Value) : Failure(o);
}
